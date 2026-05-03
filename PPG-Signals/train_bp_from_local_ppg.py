import argparse
import os
from typing import Dict, List, Tuple

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy.signal import find_peaks
from sklearn.model_selection import KFold, train_test_split
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.layers import (
	Activation,
	BatchNormalization,
	Bidirectional,
	Concatenate,
	Conv1D,
	Dense,
	Dropout,
	Flatten,
	Input,
	LSTM,
	Lambda,
	MaxPooling1D,
	Multiply,
	Reshape,
)
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
import tensorflow.keras.backend as K


SEED = 42
np.random.seed(SEED)
tf.random.set_seed(SEED)


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(
		description="Train cuffless BP model from local PPG CSV windows."
	)
	parser.add_argument("--csv", default="accepted_windows.csv", help="Input CSV path")
	parser.add_argument("--window-size", type=int, default=500, help="Resampled model window size")
	parser.add_argument("--max-samples", type=int, default=50000, help="Max labeled samples to use")
	parser.add_argument("--epochs", type=int, default=40, help="Training epochs")
	parser.add_argument("--batch-size", type=int, default=128, help="Training batch size")
	parser.add_argument("--lr", type=float, default=1e-3, help="Initial learning rate")
	parser.add_argument(
		"--min-labeled-rows",
		type=int,
		default=12,
		help="Minimum labeled rows required to run training",
	)
	parser.add_argument(
		"--sbp-min",
		type=float,
		default=75.0,
		help="Minimum SBP to keep",
	)
	parser.add_argument(
		"--sbp-max",
		type=float,
		default=200.0,
		help="Maximum SBP to keep",
	)
	parser.add_argument(
		"--dbp-min",
		type=float,
		default=40.0,
		help="Minimum DBP to keep",
	)
	parser.add_argument(
		"--dbp-max",
		type=float,
		default=130.0,
		help="Maximum DBP to keep",
	)
	parser.add_argument(
		"--normal-only",
		action="store_true",
		help="Use only normal BP windows: SBP <120 and DBP <80",
	)
	parser.add_argument(
		"--kfold",
		type=int,
		default=0,
		help="If >1, run K-fold cross-validation summary before final training",
	)
	parser.add_argument(
		"--kfold-epochs",
		type=int,
		default=12,
		help="Epochs per fold during K-fold cross-validation",
	)
	parser.add_argument(
		"--kfold-batch-size",
		type=int,
		default=32,
		help="Batch size per fold during K-fold cross-validation",
	)
	return parser.parse_args()



def parse_signal_cell(cell: str) -> np.ndarray:
	cleaned = str(cell).strip().strip('"').strip("'")
	values = []
	for raw_v in cleaned.split(","):
		token = raw_v.strip().strip('"').strip("'")
		if not token:
			continue
		values.append(float(token))
	return np.asarray(values, dtype=np.float32)


def get_signal_cell(row: pd.Series) -> str:
	"""Return signal cell from supported schemas.

	Priority:
	1) filtered_values (local accepted windows format)
	2) ir_data / IR (Firebase-style export format)
	"""
	for key in ["filtered_values", "ir_data", "IR"]:
		if key in row.index:
			value = row[key]
			if pd.notna(value) and str(value).strip() not in {"", "[]", "nan", "None"}:
				return str(value)
	return ""


def load_training_csv(csv_path: str) -> pd.DataFrame:
	try:
		return pd.read_csv(csv_path)
	except pd.errors.ParserError:
		print("Standard CSV parsing failed; using robust fallback parser...")

		rows: List[Dict[str, str]] = []
		with open(csv_path, "r", encoding="utf-8", errors="replace", newline="") as f:
			lines = f.read().splitlines()

		if not lines:
			return pd.DataFrame()

		header = [h.strip().strip('"') for h in lines[0].split(",")]
		expected_cols = 8
		if len(header) < expected_cols:
			raise RuntimeError(
				f"CSV header has too few columns ({len(header)}). Expected at least {expected_cols}."
			)

		# Keep first 7 columns as structured fields and collapse remainder into filtered_values.
		col_names = header[:expected_cols - 1] + ["filtered_values"]

		for line_no, line in enumerate(lines[1:], start=2):
			text = line.strip()
			if not text:
				continue

			parts = text.split(",", expected_cols - 1)
			if len(parts) < expected_cols:
				parts += [""] * (expected_cols - len(parts))

			row = {
				col_names[i]: parts[i].strip()
				for i in range(expected_cols)
			}
			rows.append(row)

		return pd.DataFrame(rows, columns=col_names)



def resample_to_size(sig: np.ndarray, target_size: int) -> np.ndarray:
	if sig.size == 0:
		return np.zeros(target_size, dtype=np.float32)
	if sig.size == target_size:
		return sig.astype(np.float32)
	x_old = np.linspace(0.0, 1.0, num=sig.size, endpoint=True)
	x_new = np.linspace(0.0, 1.0, num=target_size, endpoint=True)
	return np.interp(x_new, x_old, sig).astype(np.float32)



def z_norm(sig: np.ndarray) -> np.ndarray:
	std = float(np.std(sig))
	if std < 1e-8:
		return np.zeros_like(sig, dtype=np.float32)
	return ((sig - float(np.mean(sig))) / std).astype(np.float32)



def extract_features_from_window(ppg_win: np.ndarray, fs: float = 12.45) -> np.ndarray:
	peaks, _ = find_peaks(ppg_win, distance=max(1, int(fs * 0.4)))

	if len(peaks) >= 2:
		rr_intervals = np.diff(peaks) / fs
		pulse_rate = 60.0 / (float(np.mean(rr_intervals)) + 1e-8)
	else:
		pulse_rate = 75.0

	amplitude = float(np.max(ppg_win) - np.min(ppg_win))
	mean_val = float(np.mean(ppg_win))
	std_val = float(np.std(ppg_win))
	centered = ppg_win - mean_val
	third_moment = float(np.mean(centered ** 3))
	fourth_moment = float(np.mean(centered ** 4))
	skewness = third_moment / ((std_val ** 3) + 1e-8)
	kurtosis = fourth_moment / ((std_val ** 4) + 1e-8)

	half_amp = float(np.min(ppg_win) + amplitude * 0.5)
	above_half = ppg_win > half_amp
	transitions = np.diff(above_half.astype(np.int32))
	rises = np.where(transitions == 1)[0]
	falls = np.where(transitions == -1)[0]

	widths: List[int] = []
	for r_idx in rises:
		subsequent_falls = falls[falls > r_idx]
		if len(subsequent_falls) > 0:
			widths.append(int(subsequent_falls[0] - r_idx))

	pulse_width = (float(np.mean(widths)) / fs) if widths else 0.3

	if len(peaks) > 0:
		rise_ratio = (float(peaks[0]) / fs) / (len(ppg_win) / fs)
	else:
		rise_ratio = 0.3

	dc = float(np.mean(np.abs(ppg_win))) + 1e-8
	ac_dc_ratio = amplitude / dc

	diff_signal = np.diff(ppg_win)
	positive_slope = float(np.mean(diff_signal[diff_signal > 0])) if np.any(diff_signal > 0) else 0.0
	negative_slope = float(np.mean(diff_signal[diff_signal < 0])) if np.any(diff_signal < 0) else 0.0

	peak_count = float(len(peaks)) / max(len(ppg_win), 1)

	pulse_rate_norm = np.clip(pulse_rate / 180.0, 0.0, 1.0)
	amplitude_norm = np.clip(amplitude / 2000.0, 0.0, 1.0)
	pulse_width_norm = np.clip(pulse_width / 2.0, 0.0, 1.0)
	rise_ratio_norm = np.clip(rise_ratio, 0.0, 1.0)
	ac_dc_norm = np.clip(ac_dc_ratio / 3.0, 0.0, 1.0)
	std_norm = np.clip(std_val / 1000.0, 0.0, 1.0)
	mean_norm = np.clip((mean_val + 2000.0) / 4000.0, 0.0, 1.0)
	skew_norm = np.tanh(skewness / 5.0)
	kurt_norm = np.tanh((kurtosis - 3.0) / 10.0)
	slope_up_norm = np.clip(positive_slope / 500.0, 0.0, 1.0)
	slope_down_norm = np.clip(abs(negative_slope) / 500.0, 0.0, 1.0)
	peak_count_norm = np.clip(peak_count * 10.0, 0.0, 1.0)

	return np.asarray(
		[
			pulse_rate_norm,
			amplitude_norm,
			pulse_width_norm,
			rise_ratio_norm,
			ac_dc_norm,
			std_norm,
			mean_norm,
			skew_norm,
			kurt_norm,
			slope_up_norm,
			slope_down_norm,
			peak_count_norm,
		],
		dtype=np.float32,
	)



def clean_and_select_rows(
	df: pd.DataFrame,
	sbp_min: float,
	sbp_max: float,
	dbp_min: float,
	dbp_max: float,
	normal_only: bool,
) -> pd.DataFrame:
	work = df.copy()

	# Accept either lowercase or uppercase BP column names.
	if "sbp" not in work.columns and "SBP" in work.columns:
		work["sbp"] = work["SBP"]
	if "dbp" not in work.columns and "DBP" in work.columns:
		work["dbp"] = work["DBP"]

	for col in ["sbp", "dbp", "quality_score", "signal_len"]:
		if col not in work.columns:
			work[col] = np.nan
		work[col] = pd.to_numeric(work[col], errors="coerce")

	# Pick whichever signal column exists in this dataset schema.
	signal_col = None
	for candidate in ["filtered_values", "ir_data", "IR"]:
		if candidate in work.columns:
			signal_col = candidate
			break

	if signal_col is None:
		raise RuntimeError(
			"No signal column found. Expected one of: filtered_values, ir_data, IR"
		)

	work = work[work[signal_col].notna()]
	work = work[work[signal_col].astype(str).str.strip().isin(["", "[]", "nan", "None"]) == False]

	# Keep only rows with real BP labels from cuff entry.
	work = work[(work["sbp"] > 0) & (work["dbp"] > 0)]

	# Clinical sanity limits similar to UCI filtering (configurable).
	work = work[(work["sbp"] >= sbp_min) & (work["sbp"] <= sbp_max)]
	work = work[(work["dbp"] >= dbp_min) & (work["dbp"] <= dbp_max)]
	work = work[((work["sbp"] - work["dbp"]) >= 15) & ((work["sbp"] - work["dbp"]) <= 100)]

	if normal_only:
		# ACC/AHA normal BP definition.
		work = work[(work["sbp"] < 120) & (work["dbp"] < 80)]

	if "quality_score" in work.columns:
		work = work[(work["quality_score"].isna()) | (work["quality_score"] >= 80)]

	return work.reset_index(drop=True)



def make_dataset(df: pd.DataFrame, window_size: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
	x_seq, x_feat, y = [], [], []

	for _, row in df.iterrows():
		signal_cell = get_signal_cell(row)
		raw = parse_signal_cell(signal_cell)
		if raw.size < 30:
			continue

		fixed = resample_to_size(raw, window_size)
		norm = z_norm(fixed)

		if float(np.std(norm)) < 1e-6:
			continue

		feats = extract_features_from_window(fixed)

		x_seq.append(norm[:, None])
		x_feat.append(feats)
		y.append([float(row["sbp"]), float(row["dbp"])])

	return (
		np.asarray(x_seq, dtype=np.float32),
		np.asarray(x_feat, dtype=np.float32),
		np.asarray(y, dtype=np.float32),
	)



def balanced_indices_by_sbp(y: np.ndarray, max_samples: int) -> np.ndarray:
	sbp = y[:, 0]
	bins = [
		(sbp < 120),
		((sbp >= 120) & (sbp < 130)),
		((sbp >= 130) & (sbp < 140)),
		((sbp >= 140) & (sbp < 160)),
		(sbp >= 160),
	]

	counts = [int(np.sum(m)) for m in bins if int(np.sum(m)) > 0]
	if not counts:
		return np.arange(len(y), dtype=np.int32)

	if len(y) <= max_samples:
		all_idx = np.arange(len(y), dtype=np.int32)
		np.random.shuffle(all_idx)
		return all_idx

	n_per_group = max(1, max_samples // len(bins))

	sampled = []
	for mask in bins:
		idx = np.where(mask)[0]
		if len(idx) == 0:
			continue
		take = min(len(idx), n_per_group)
		sampled_idx = np.random.choice(idx, size=take, replace=False)
		sampled.append(sampled_idx)

	all_idx = np.concatenate(sampled) if sampled else np.arange(len(y), dtype=np.int32)
	np.random.shuffle(all_idx)
	return all_idx[:max_samples]



def compute_sample_weights(y: np.ndarray) -> np.ndarray:
	sbp = y[:, 0]
	bins = [
		(sbp < 120),
		((sbp >= 120) & (sbp < 130)),
		((sbp >= 130) & (sbp < 140)),
		((sbp >= 140) & (sbp < 160)),
		(sbp >= 160),
	]

	weights = np.ones(len(y), dtype=np.float32)
	non_empty_counts = [max(int(np.sum(mask)), 1) for mask in bins]
	target_count = float(max(non_empty_counts))

	for mask, count in zip(bins, non_empty_counts):
		weights[mask] = target_count / float(count)

	weights /= float(np.mean(weights))
	return weights



def temporal_attention(x: tf.Tensor) -> tf.Tensor:
	score = Dense(1, activation="tanh")(x)
	score = Flatten()(score)
	alpha = Activation("softmax")(score)
	alpha = Reshape((-1, 1))(alpha)
	context = Multiply()([x, alpha])
	context = Lambda(lambda t: K.sum(t, axis=1))(context)
	return context



def build_model(window_size: int, n_channels: int = 1, n_features: int = 12) -> Model:
	seq_input = Input(shape=(window_size, n_channels), name="seq_input")

	x = Conv1D(32, 5, padding="same")(seq_input)
	x = BatchNormalization()(x)
	x = Activation("relu")(x)
	x = MaxPooling1D(2)(x)
	x = Dropout(0.1)(x)

	x = Conv1D(64, 3, padding="same")(x)
	x = BatchNormalization()(x)
	x = Activation("relu")(x)
	x = MaxPooling1D(2)(x)
	x = Dropout(0.1)(x)

	x = Conv1D(128, 3, padding="same")(x)
	x = BatchNormalization()(x)
	x = Activation("relu")(x)
	x = MaxPooling1D(2)(x)

	x = Bidirectional(LSTM(64, return_sequences=True))(x)
	x = Dropout(0.2)(x)
	x = Bidirectional(LSTM(32, return_sequences=True))(x)
	x = Dropout(0.2)(x)

	context = temporal_attention(x)

	feat_input = Input(shape=(n_features,), name="feat_input")
	f = Dense(32, activation="relu")(feat_input)
	f = BatchNormalization()(f)
	f = Dense(16, activation="relu")(f)

	merged = Concatenate()([context, f])
	out = Dense(128, activation="relu")(merged)
	out = Dropout(0.2)(out)
	out = Dense(64, activation="relu")(out)
	out = Dropout(0.1)(out)
	output = Dense(2, activation="sigmoid", name="output")(out)

	return Model(inputs=[seq_input, feat_input], outputs=output)



def bhs_grade(errors: np.ndarray) -> Tuple[str, float, float, float]:
	p5 = float(np.mean(errors <= 5) * 100.0)
	p10 = float(np.mean(errors <= 10) * 100.0)
	p15 = float(np.mean(errors <= 15) * 100.0)

	if p5 >= 60 and p10 >= 85 and p15 >= 95:
		grade = "A"
	elif p5 >= 50 and p10 >= 75 and p15 >= 90:
		grade = "B"
	elif p5 >= 40 and p10 >= 65 and p15 >= 85:
		grade = "C"
	else:
		grade = "D"

	return grade, p5, p10, p15



def evaluate_and_report(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
	sbp_err = np.abs(y_true[:, 0] - y_pred[:, 0])
	dbp_err = np.abs(y_true[:, 1] - y_pred[:, 1])

	sbp_me = float(np.mean(y_pred[:, 0] - y_true[:, 0]))
	dbp_me = float(np.mean(y_pred[:, 1] - y_true[:, 1]))
	sbp_sd = float(np.std(y_pred[:, 0] - y_true[:, 0]))
	dbp_sd = float(np.std(y_pred[:, 1] - y_true[:, 1]))

	sg, sp5, sp10, sp15 = bhs_grade(sbp_err)
	dg, dp5, dp10, dp15 = bhs_grade(dbp_err)

	print("\n" + "=" * 62)
	print(f"{'Metric':<30} {'SBP':>12} {'DBP':>12}")
	print("-" * 62)
	print(f"{'MAE (mmHg)':<30} {sbp_err.mean():>12.2f} {dbp_err.mean():>12.2f}")
	print(f"{'Bias (mmHg)':<30} {sbp_me:>12.2f} {dbp_me:>12.2f}")
	print(f"{'Std Dev (mmHg)':<30} {sbp_sd:>12.2f} {dbp_sd:>12.2f}")
	print(f"{'% within +-5 mmHg':<30} {sp5:>11.1f}% {dp5:>11.1f}%")
	print(f"{'% within +-10 mmHg':<30} {sp10:>11.1f}% {dp10:>11.1f}%")
	print(f"{'BHS Grade':<30} {sg:>12} {dg:>12}")
	print("=" * 62)

	return {
		"sbp_mae": float(sbp_err.mean()),
		"dbp_mae": float(dbp_err.mean()),
		"sbp_bias": sbp_me,
		"dbp_bias": dbp_me,
		"sbp_sd": sbp_sd,
		"dbp_sd": dbp_sd,
	}



def save_training_plot(history: tf.keras.callbacks.History, out_path: str) -> None:
	best_epoch = int(np.argmin(history.history["val_loss"])) + 1

	fig, axes = plt.subplots(1, 2, figsize=(14, 5))

	axes[0].plot(history.history["loss"], label="Train", lw=2)
	axes[0].plot(history.history["val_loss"], label="Val", lw=2)
	axes[0].axvline(best_epoch - 1, color="g", ls="--", label=f"Best ({best_epoch})")
	axes[0].set_xlabel("Epoch")
	axes[0].set_ylabel("Huber Loss")
	axes[0].set_title("Loss")
	axes[0].legend()
	axes[0].grid(alpha=0.3)

	axes[1].plot(history.history["mae"], label="Train MAE", lw=2)
	axes[1].plot(history.history["val_mae"], label="Val MAE", lw=2)
	axes[1].axvline(best_epoch - 1, color="g", ls="--")
	axes[1].set_xlabel("Epoch")
	axes[1].set_ylabel("MAE (scaled)")
	axes[1].set_title("MAE")
	axes[1].legend()
	axes[1].grid(alpha=0.3)

	plt.tight_layout()
	plt.savefig(out_path, dpi=150)
	plt.close(fig)



def save_evaluation_plots(y_true: np.ndarray, y_pred: np.ndarray, out_path: str) -> None:
	fig, axes = plt.subplots(2, 2, figsize=(14, 10))

	labels = ["SBP", "DBP"]
	for row, col in enumerate([0, 1]):
		err = y_pred[:, col] - y_true[:, col]
		abs_err = np.abs(err)

		ax = axes[row, 0]
		ax.scatter(y_true[:, col], y_pred[:, col], s=28, alpha=0.8)
		min_v = float(min(y_true[:, col].min(), y_pred[:, col].min()))
		max_v = float(max(y_true[:, col].max(), y_pred[:, col].max()))
		ax.plot([min_v, max_v], [min_v, max_v], "k--", lw=1)
		ax.set_title(f"{labels[row]}: True vs Predicted")
		ax.set_xlabel(f"True {labels[row]} (mmHg)")
		ax.set_ylabel(f"Predicted {labels[row]} (mmHg)")
		ax.grid(alpha=0.25)

		ax = axes[row, 1]
		ax.hist(abs_err, bins=12, alpha=0.85, color="#3b82f6")
		ax.set_title(f"{labels[row]} Absolute Error")
		ax.set_xlabel("Absolute Error (mmHg)")
		ax.set_ylabel("Count")
		ax.grid(alpha=0.25)

	plt.tight_layout()
	plt.savefig(out_path, dpi=150)
	plt.close(fig)



def save_text_report(
	out_path: str,
	args: argparse.Namespace,
	data_stats: Dict[str, int],
	metrics: Dict[str, float],
	y_true: np.ndarray,
	y_pred: np.ndarray,
) -> None:
	lines = [
		"Training report",
		"===============",
		f"CSV: {args.csv}",
		f"Window size: {args.window_size}",
		f"Epochs: {args.epochs}",
		f"Batch size: {args.batch_size}",
		f"Rows in CSV: {data_stats['rows_in_csv']}",
		f"Usable labeled rows: {data_stats['usable_rows']}",
		f"Balanced set: {data_stats['balanced_rows']}",
		f"Split sizes: train={data_stats['train_rows']}, val={data_stats['val_rows']}, test={data_stats['test_rows']}",
		"",
		f"SBP MAE: {metrics['sbp_mae']:.2f} mmHg",
		f"DBP MAE: {metrics['dbp_mae']:.2f} mmHg",
		f"SBP bias: {metrics['sbp_bias']:.2f} mmHg",
		f"DBP bias: {metrics['dbp_bias']:.2f} mmHg",
		f"SBP std dev: {metrics['sbp_sd']:.2f} mmHg",
		f"DBP std dev: {metrics['dbp_sd']:.2f} mmHg",
		f"SBP true range: {y_true[:, 0].min():.1f} to {y_true[:, 0].max():.1f}",
		f"DBP true range: {y_true[:, 1].min():.1f} to {y_true[:, 1].max():.1f}",
		f"SBP predicted range: {y_pred[:, 0].min():.1f} to {y_pred[:, 0].max():.1f}",
		f"DBP predicted range: {y_pred[:, 1].min():.1f} to {y_pred[:, 1].max():.1f}",
	]

	with open(out_path, "w", encoding="utf-8") as f:
		f.write("\n".join(lines) + "\n")



def run_kfold_cv(
	x_seq: np.ndarray,
	x_feat: np.ndarray,
	y: np.ndarray,
	n_splits: int,
	lr: float,
	epochs: int,
	batch_size: int,
) -> Dict[str, float]:
	kf = KFold(n_splits=n_splits, shuffle=True, random_state=SEED)

	sbp_maes: List[float] = []
	dbp_maes: List[float] = []

	print(f"\nRunning {n_splits}-fold cross-validation...")

	for fold_id, (idx_train, idx_val) in enumerate(kf.split(y), start=1):
		x_seq_train, x_seq_val = x_seq[idx_train], x_seq[idx_val]
		x_feat_train, x_feat_val = x_feat[idx_train], x_feat[idx_val]
		y_train, y_val = y[idx_train], y[idx_val]

		scaler_y = MinMaxScaler(feature_range=(0, 1))
		y_train_s = scaler_y.fit_transform(y_train)
		y_val_s = scaler_y.transform(y_val)

		feat_mean = x_feat_train.mean(axis=0)
		feat_std = x_feat_train.std(axis=0) + 1e-8
		x_feat_train_s = (x_feat_train - feat_mean) / feat_std
		x_feat_val_s = (x_feat_val - feat_mean) / feat_std

		fold_weights = compute_sample_weights(y_train)

		fold_model = build_model(
			window_size=x_seq.shape[1],
			n_channels=x_seq.shape[2],
			n_features=x_feat.shape[1],
		)
		fold_model.compile(optimizer=Adam(lr), loss="huber", metrics=["mae"])

		fold_callbacks = [
			EarlyStopping(monitor="val_loss", patience=4, restore_best_weights=True, verbose=0),
			ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6, verbose=0),
		]

		fold_model.fit(
			[x_seq_train, x_feat_train_s],
			y_train_s,
			validation_data=([x_seq_val, x_feat_val_s], y_val_s),
			sample_weight=fold_weights,
			epochs=epochs,
			batch_size=max(1, min(batch_size, len(y_train))),
			callbacks=fold_callbacks,
			verbose=0,
		)

		y_pred_val_s = fold_model.predict([x_seq_val, x_feat_val_s], batch_size=256, verbose=0)
		y_pred_val = scaler_y.inverse_transform(y_pred_val_s)

		sbp_mae = float(np.mean(np.abs(y_pred_val[:, 0] - y_val[:, 0])))
		dbp_mae = float(np.mean(np.abs(y_pred_val[:, 1] - y_val[:, 1])))
		sbp_maes.append(sbp_mae)
		dbp_maes.append(dbp_mae)

		print(
			f"  Fold {fold_id}/{n_splits}: "
			f"SBP MAE={sbp_mae:.2f} mmHg, DBP MAE={dbp_mae:.2f} mmHg"
		)

	summary = {
		"kfold_sbp_mae_mean": float(np.mean(sbp_maes)),
		"kfold_sbp_mae_std": float(np.std(sbp_maes)),
		"kfold_dbp_mae_mean": float(np.mean(dbp_maes)),
		"kfold_dbp_mae_std": float(np.std(dbp_maes)),
	}

	print(
		"K-fold summary: "
		f"SBP MAE={summary['kfold_sbp_mae_mean']:.2f}+-{summary['kfold_sbp_mae_std']:.2f} mmHg, "
		f"DBP MAE={summary['kfold_dbp_mae_mean']:.2f}+-{summary['kfold_dbp_mae_std']:.2f} mmHg"
	)
	return summary



def save_kfold_report(out_path: str, summary: Dict[str, float], n_splits: int) -> None:
	lines = [
		"K-fold cross-validation report",
		"============================",
		f"Folds: {n_splits}",
		f"SBP MAE mean: {summary['kfold_sbp_mae_mean']:.2f} mmHg",
		f"SBP MAE std: {summary['kfold_sbp_mae_std']:.2f} mmHg",
		f"DBP MAE mean: {summary['kfold_dbp_mae_mean']:.2f} mmHg",
		f"DBP MAE std: {summary['kfold_dbp_mae_std']:.2f} mmHg",
	]
	with open(out_path, "w", encoding="utf-8") as f:
		f.write("\n".join(lines) + "\n")



def main() -> None:
	args = parse_args()

	if not os.path.exists(args.csv):
		raise FileNotFoundError(f"CSV not found: {args.csv}")

	print(f"Loading CSV: {args.csv}")
	raw_df = load_training_csv(args.csv)
	print(f"Rows in CSV: {len(raw_df):,}")

	if args.normal_only:
		print("Using normal-only BP mode: SBP <120 and DBP <80")
	else:
		print(
			f"Using BP filter range: SBP [{args.sbp_min}, {args.sbp_max}], "
			f"DBP [{args.dbp_min}, {args.dbp_max}]"
		)

	df = clean_and_select_rows(
		raw_df,
		sbp_min=args.sbp_min,
		sbp_max=args.sbp_max,
		dbp_min=args.dbp_min,
		dbp_max=args.dbp_max,
		normal_only=args.normal_only,
	)
	print(f"Rows with usable BP labels: {len(df):,}")

	if len(df) < args.min_labeled_rows:
		raise RuntimeError(
			f"Too few usable labeled rows (<{args.min_labeled_rows}). "
			"Add more rows with real SBP/DBP labels."
		)

	if len(df) < 100:
		print(
			"WARNING: Very small labeled dataset. "
			"Training will run, but metrics will be unstable and not clinically reliable."
		)

	x_seq, x_feat, y = make_dataset(df, args.window_size)
	print(f"Built arrays: X_seq={x_seq.shape}, X_feat={x_feat.shape}, y={y.shape}")

	if len(y) < args.min_labeled_rows:
		raise RuntimeError(
			f"Too few valid windows after parsing and filtering (<{args.min_labeled_rows})."
		)

	keep_idx = balanced_indices_by_sbp(y, args.max_samples)
	x_seq, x_feat, y = x_seq[keep_idx], x_feat[keep_idx], y[keep_idx]
	sample_weights = compute_sample_weights(y)
	balanced_rows = len(y)

	print(f"Balanced/selected set: {len(y):,}")
	print(f"SBP range: {y[:, 0].min():.1f} to {y[:, 0].max():.1f}")
	print(f"DBP range: {y[:, 1].min():.1f} to {y[:, 1].max():.1f}")

	if args.kfold > 1:
		min_required = max(20, args.kfold * 6)
		if len(y) < min_required:
			print(
				f"Skipping K-fold: need at least {min_required} rows for k={args.kfold}, "
				f"but only {len(y)} available."
			)
		else:
			kfold_summary = run_kfold_cv(
				x_seq=x_seq,
				x_feat=x_feat,
				y=y,
				n_splits=args.kfold,
				lr=args.lr,
				epochs=args.kfold_epochs,
				batch_size=args.kfold_batch_size,
			)
			save_kfold_report("local_bp_kfold_report.txt", kfold_summary, args.kfold)

	idx = np.arange(len(y))
	n = len(y)

	# Dynamic split to support tiny datasets while preserving train/val/test.
	if n >= 20:
		test_frac = 0.30
	else:
		# Keep at least 8 training samples for tiny datasets.
		test_frac = min(0.40, max(0.20, (n - 8) / max(n, 1)))

	idx_train, idx_temp = train_test_split(idx, test_size=test_frac, random_state=SEED)

	if len(idx_temp) < 2:
		raise RuntimeError(
			"Not enough samples left for validation/test split. "
			"Add more labeled rows or reduce --min-labeled-rows."
		)

	idx_val, idx_test = train_test_split(idx_temp, test_size=0.50, random_state=SEED)

	x_seq_train, x_seq_val, x_seq_test = x_seq[idx_train], x_seq[idx_val], x_seq[idx_test]
	x_feat_train, x_feat_val, x_feat_test = x_feat[idx_train], x_feat[idx_val], x_feat[idx_test]
	y_train, y_val, y_test = y[idx_train], y[idx_val], y[idx_test]

	print(
		f"Split sizes: train={len(y_train):,}, val={len(y_val):,}, test={len(y_test):,}"
	)

	scaler_y = MinMaxScaler(feature_range=(0, 1))
	y_train_s = scaler_y.fit_transform(y_train)
	y_val_s = scaler_y.transform(y_val)
	y_test_s = scaler_y.transform(y_test)

	feat_mean = x_feat_train.mean(axis=0)
	feat_std = x_feat_train.std(axis=0) + 1e-8

	x_feat_train = (x_feat_train - feat_mean) / feat_std
	x_feat_val = (x_feat_val - feat_mean) / feat_std
	x_feat_test = (x_feat_test - feat_mean) / feat_std

	train_sample_weights = sample_weights[idx_train]

	joblib.dump(scaler_y, "local_scaler_y.pkl")
	joblib.dump({"mean": feat_mean, "std": feat_std}, "local_feat_scaler.pkl")

	model = build_model(window_size=args.window_size, n_channels=1, n_features=x_feat.shape[1])
	model.compile(optimizer=Adam(args.lr), loss="huber", metrics=["mae"])
	model.summary()

	callbacks = [
		EarlyStopping(monitor="val_loss", patience=8, restore_best_weights=True, verbose=1),
		ModelCheckpoint("best_local_bp_model.keras", monitor="val_loss", save_best_only=True, verbose=1),
		ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-6, verbose=1),
	]

	effective_batch_size = max(1, min(args.batch_size, len(y_train)))

	history = model.fit(
		[x_seq_train, x_feat_train],
		y_train_s,
		validation_data=([x_seq_val, x_feat_val], y_val_s),
		sample_weight=train_sample_weights,
		epochs=args.epochs,
		batch_size=effective_batch_size,
		callbacks=callbacks,
		verbose=1,
	)

	y_pred_s = model.predict([x_seq_test, x_feat_test], batch_size=256, verbose=0)
	y_pred = scaler_y.inverse_transform(y_pred_s)

	metrics = evaluate_and_report(y_test, y_pred)
	print(f"Final MAE SBP/DBP: {metrics['sbp_mae']:.2f} / {metrics['dbp_mae']:.2f} mmHg")

	model.save("local_bp_cnn_bilstm_attention.keras")
	save_training_plot(history, "local_training_curves.png")
	save_evaluation_plots(y_test, y_pred, "local_bp_evaluation_plots.png")
	save_text_report(
		"local_bp_training_report.txt",
		args,
		{
			"rows_in_csv": len(raw_df),
			"usable_rows": len(df),
			"balanced_rows": balanced_rows,
			"train_rows": len(y_train),
			"val_rows": len(y_val),
			"test_rows": len(y_test),
		},
		metrics,
		y_test,
		y_pred,
	)

	np.savez_compressed(
		"local_bp_test_predictions.npz",
		y_true=y_test,
		y_pred=y_pred,
	)

	print("Saved artifacts:")
	print("  local_bp_cnn_bilstm_attention.keras")
	print("  best_local_bp_model.keras")
	print("  local_scaler_y.pkl")
	print("  local_feat_scaler.pkl")
	print("  local_training_curves.png")
	print("  local_bp_evaluation_plots.png")
	print("  local_bp_training_report.txt")
	if args.kfold > 1:
		print("  local_bp_kfold_report.txt")
	print("  local_bp_test_predictions.npz")


if __name__ == "__main__":
	main()