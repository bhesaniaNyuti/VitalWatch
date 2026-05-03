import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import requests
import numpy as np
from datetime import datetime
import os
import csv
import time
from scipy.signal import find_peaks

WINDOWS_TO_SHOW = 5
POLL_INTERVAL_MS = 5000
HTTP_TIMEOUT_SEC = 15
FIREBASE_READINGS_URL = "https://bpmonitor-c6128-default-rtdb.firebaseio.com/readings.json"
SAMPLE_RATE_HZ = 747.0 / 60.0
MODEL_WINDOW_SIZE = 500
ERROR_LOG_INTERVAL_SEC = 30
REQUEST_VERIFY_SSL = os.getenv("PPG_VERIFY_SSL", "1").strip().lower() not in ("0", "false", "no")

ACCEPTED_WINDOWS_CSV = "accepted_windows.csv"
MODEL_READY_NPZ = "model_ready_live.npz"

accepted_window_ids = set()
last_error_log_ts = 0.0


def parse_timestamp(value):
	if value in (None, ''):
		return 0.0
	if isinstance(value, (int, float)):
		return float(value)
	try:
		return datetime.fromisoformat(str(value).replace('Z', '+00:00')).timestamp()
	except ValueError:
		return 0.0


def parse_numeric_token(value):
	token = str(value).strip().strip('"').strip("'")
	token = token.replace('"', '').replace("'", '')
	return float(token)


def parse_ir_values(ir_cell):
	if isinstance(ir_cell, list):
		parsed = []
		for x in ir_cell:
			try:
				parsed.append(parse_numeric_token(x))
			except (ValueError, TypeError):
				continue
		return parsed

	if isinstance(ir_cell, dict):
		ordered_keys = sorted(ir_cell.keys(), key=lambda k: int(k) if str(k).isdigit() else str(k))
		parsed = []
		for key in ordered_keys:
			try:
				parsed.append(parse_numeric_token(ir_cell[key]))
			except (ValueError, TypeError):
				continue
		return parsed

	ir_string = str(ir_cell).strip('"').strip("'")
	# Remove all quote characters and clean up malformed values
	ir_string = ir_string.replace('"', '').replace("'", '')
	result = []
	for x in ir_string.split(','):
		x_clean = x.strip()
		if x_clean:
			try:
				result.append(parse_numeric_token(x_clean))
			except ValueError:
				# Skip values that can't be converted
				continue
	return result


def parse_optional_float(value):
	if value in (None, '', 'nan'):
		return np.nan
	try:
		return parse_numeric_token(value)
	except (ValueError, TypeError):
		return np.nan


def moving_average(signal, window_size):
	if window_size <= 1:
		return signal
	if window_size % 2 == 0:
		window_size += 1
	kernel = np.ones(window_size, dtype=np.float32) / float(window_size)
	pad = window_size // 2
	padded = np.pad(signal, (pad, pad), mode='edge')
	return np.convolve(padded, kernel, mode='valid')


def preprocess_ppg(ir_values):
	arr = np.asarray(ir_values, dtype=np.float32)
	if arr.size < 5:
		return arr, 0.0

	# Track saturation BEFORE cleanup
	sat_high = arr >= 262000
	sat_low = arr <= 100
	sat = sat_high | sat_low
	saturation_ratio = float(np.sum(sat)) / float(arr.size) if arr.size > 0 else 0.0

	# Remove obvious ADC saturation values before filtering.
	if np.any(sat) and np.any(~sat):
		idx = np.arange(arr.size)
		arr[sat] = np.interp(idx[sat], idx[~sat], arr[~sat]).astype(np.float32)

	# Robust despike to suppress contact-on/off or communication glitches.
	median = float(np.median(arr))
	mad = float(np.median(np.abs(arr - median))) + 1e-6
	robust_z = np.abs(arr - median) / (1.4826 * mad)
	bad = robust_z > 10.0
	if np.any(bad) and np.any(~bad):
		idx = np.arange(arr.size)
		arr[bad] = np.interp(idx[bad], idx[~bad], arr[~bad]).astype(np.float32)

	# Remove low-frequency baseline drift (high-pass style via trend subtraction).
	baseline_window = max(5, int(SAMPLE_RATE_HZ * 2.0))
	baseline = moving_average(arr, baseline_window)
	detrended = arr - baseline

	# Gentle smoothing to reduce high-frequency noise.
	smooth_window = max(3, int(SAMPLE_RATE_HZ * 0.2))
	smoothed = moving_average(detrended, smooth_window)

	# Clip residual extreme outliers to keep plotting stable.
	lo, hi = np.percentile(smoothed, [1, 99])
	clipped = np.clip(smoothed, lo, hi)

	return clipped, saturation_ratio


def format_row_label(row, row_number):
	timestamp = row.get('timestamp', 'Unknown time')
	bpm_raw = parse_optional_float(row.get('bpm', ''))
	bpm = int(bpm_raw) if np.isfinite(bpm_raw) and bpm_raw > 0 else 'N/A'
	window_id = row.get('window_id', row_number)
	sbp = row.get('SBP', row.get('sbp', 'N/A'))
	dbp = row.get('DBP', row.get('dbp', 'N/A'))
	return f"Window: {window_id} | Row: {row_number} | {timestamp} | BPM: {bpm} | SBP/DBP: {sbp}/{dbp}"


def to_fixed_window(signal, target_size=MODEL_WINDOW_SIZE):
	if signal.size == 0:
		return np.zeros(target_size, dtype=np.float32)
	if signal.size == target_size:
		return signal.astype(np.float32)

	x_old = np.linspace(0.0, 1.0, num=signal.size, endpoint=True)
	x_new = np.linspace(0.0, 1.0, num=target_size, endpoint=True)
	resized = np.interp(x_new, x_old, signal)
	return resized.astype(np.float32)


def normalize_window(signal):
	mean = float(np.mean(signal))
	std = float(np.std(signal))
	return (signal - mean) / (std + 1e-8)


def assess_window_quality(ir_values, processed_signal, bpm, raw_saturation_ratio):
	"""
	Assess window quality across multiple dimensions.
	Returns: (is_acceptable, quality_score, rejection_reasons)
	- quality_score: 0-100 (higher is better)
	- rejection_reasons: list of strings explaining why window was rejected
	"""
	reasons = []
	score = 100.0
    
	# 1. BPM is optional for old firmware; gate mostly on signal shape.
	bpm_val = parse_optional_float(bpm)
	if np.isfinite(bpm_val) and bpm_val > 0:
		if bpm_val < 40 or bpm_val > 150:
			reasons.append(f"BPM out of range: {bpm_val:.0f}")
			score -= 30
    
	# 2. RMS energy (signal too weak = poor contact)
	signal_rms = float(np.sqrt(np.mean(processed_signal**2)))
	if signal_rms < 150:
		reasons.append(f"Low RMS energy: {signal_rms:.0f} (threshold: 150)")
		score -= 25
	elif signal_rms < 300:
		score -= 10  # Weak signal, but still usable
    
	# 3. Peak count (detect heartbeats in window)
	abs_signal = np.abs(processed_signal)
	try:
		peaks, _ = find_peaks(abs_signal, height=np.percentile(abs_signal, 30), distance=int(SAMPLE_RATE_HZ * 0.4))
		peak_count = len(peaks)
		if peak_count < 2:
			reasons.append(f"Too few peaks detected: {peak_count} (threshold: ≥2)")
			score -= 35
		elif peak_count < 4:
			score -= 15  # Few peaks, lower confidence
	except Exception as e:
		reasons.append(f"Peak detection error: {str(e)}")
		score -= 20
    
	# 4. Saturation ratio (>15% indicates poor contact or clipping)
	if raw_saturation_ratio > 0.20:
		reasons.append(f"High saturation: {raw_saturation_ratio:.1%} (threshold: 20%)")
		score -= 20
	elif raw_saturation_ratio > 0.10:
		score -= 8  # Moderate saturation
    
	# 5. Amplitude range (peak-to-peak should be reasonable)
	signal_range = np.ptp(processed_signal)
	if signal_range < 50:
		reasons.append(f"Low amplitude: {signal_range:.0f} (threshold: 50)")
		score -= 20

	# 5b. Expected duration/samples for this pipeline (around 60 sec @ 12.45 Hz).
	n = int(len(ir_values))
	if n < 600 or n > 900:
		reasons.append(f"Unexpected sample count: {n} (expected ~747)")
		score -= 10
    
	# 6. Baseline stability (check for extreme baseline wander)
	if len(processed_signal) >= 10:
		first_half = np.mean(processed_signal[:len(processed_signal)//2])
		second_half = np.mean(processed_signal[len(processed_signal)//2:])
		baseline_drift = abs(first_half - second_half)
		if baseline_drift > signal_range * 0.5:
			reasons.append(f"Extreme baseline drift: {baseline_drift:.0f}")
			score -= 15
    
	# Overall decision
	is_acceptable = score >= 50 and len(reasons) <= 2
	score = max(0, min(100, score))  # Clamp to 0-100
    
	return is_acceptable, score, reasons


def load_existing_accepted_ids():
	if not os.path.exists(ACCEPTED_WINDOWS_CSV):
		return

	with open(ACCEPTED_WINDOWS_CSV, 'r', encoding='utf-8', newline='') as f:
		reader = csv.DictReader(f)
		for row in reader:
			window_id = str(row.get('window_id', '')).strip()
			if window_id:
				accepted_window_ids.add(window_id)


def append_accepted_window(row, processed_signal, quality_score, is_acceptable):
	"""
	Append window to CSV only if it passes quality gates.
	Also logs rejection reasons if needed.
	"""
	window_id = str(row.get('window_id', '')).strip()
	if not window_id or window_id in accepted_window_ids:
		return False
    
	# Only save if quality gates pass
	if not is_acceptable:
		return False

	write_header = not os.path.exists(ACCEPTED_WINDOWS_CSV)
	sbp = row.get('SBP', row.get('sbp', ''))
	dbp = row.get('DBP', row.get('dbp', ''))

	record = {
		'window_id': window_id,
		'timestamp': row.get('timestamp', ''),
		'bpm': row.get('bpm', ''),
		'spo2': row.get('spo2', ''),
		'sbp': sbp,
		'dbp': dbp,
		'quality_score': f"{quality_score:.1f}",
		'signal_len': int(processed_signal.size),
		'filtered_values': ','.join(f"{x:.6f}" for x in processed_signal.tolist()),
	}

	with open(ACCEPTED_WINDOWS_CSV, 'a', encoding='utf-8', newline='') as f:
		writer = csv.DictWriter(f, fieldnames=list(record.keys()), quoting=csv.QUOTE_NONNUMERIC)
		if write_header:
			writer.writeheader()
		writer.writerow(record)

	accepted_window_ids.add(window_id)
	return True


def rebuild_model_ready_npz():
	if not os.path.exists(ACCEPTED_WINDOWS_CSV):
		return

	windows = []
	window_ids = []
	timestamps = []
	bpms = []
	spo2s = []
	sbps = []
	dbps = []

	with open(ACCEPTED_WINDOWS_CSV, 'r', encoding='utf-8', newline='') as f:
		reader = csv.DictReader(f)
		for row in reader:
			values = str(row.get('filtered_values', '')).strip()
			if not values:
				continue

			arr = np.asarray([float(v) for v in values.split(',') if v], dtype=np.float32)
			if arr.size == 0:
				continue

			fixed = to_fixed_window(arr, target_size=MODEL_WINDOW_SIZE)
			normed = normalize_window(fixed)
			windows.append(normed)

			window_ids.append(str(row.get('window_id', '')))
			timestamps.append(str(row.get('timestamp', '')))
			bpms.append(float(row.get('bpm', 'nan')) if str(row.get('bpm', '')).strip() else np.nan)
			spo2s.append(float(row.get('spo2', 'nan')) if str(row.get('spo2', '')).strip() else np.nan)
			sbps.append(float(row.get('sbp', 'nan')) if str(row.get('sbp', '')).strip() else np.nan)
			dbps.append(float(row.get('dbp', 'nan')) if str(row.get('dbp', '')).strip() else np.nan)

	if not windows:
		return

	X = np.asarray(windows, dtype=np.float32).reshape(len(windows), MODEL_WINDOW_SIZE, 1)

	np.savez_compressed(
		MODEL_READY_NPZ,
		X=X,
		window_id=np.asarray(window_ids, dtype=object),
		timestamp=np.asarray(timestamps, dtype=object),
		bpm=np.asarray(bpms, dtype=np.float32),
		spo2=np.asarray(spo2s, dtype=np.float32),
		sbp=np.asarray(sbps, dtype=np.float32),
		dbp=np.asarray(dbps, dtype=np.float32),
	)


def process_records_for_storage(all_records):
	any_saved = False
	rejected_count = 0
	for row in all_records:
		ir_values = parse_ir_values(row.get('IR', ''))
		if not ir_values:
			continue

		processed, saturation_ratio = preprocess_ppg(ir_values)
		if processed.size == 0:
			continue

		# Assess quality
		bpm = row.get('bpm', 'nan')
		is_acceptable, quality_score, rejection_reasons = assess_window_quality(
			ir_values, processed, bpm, saturation_ratio
		)
        
		if append_accepted_window(row, processed, quality_score, is_acceptable):
			any_saved = True
		else:
			if not is_acceptable:
				rejected_count += 1

	return any_saved


def load_records():
	response = requests.get(FIREBASE_READINGS_URL, timeout=HTTP_TIMEOUT_SEC, verify=REQUEST_VERIFY_SSL)
	response.raise_for_status()
	payload = response.json() or {}

	records = []
	if isinstance(payload, dict):
		for key, value in payload.items():
			if not isinstance(value, dict):
				continue

			if 'ir_data' not in value and 'IR' not in value:
				continue

			data = dict(value)
			data['window_id'] = data.get('window_id', key)
			data['IR'] = data.get('IR', data.get('ir_data', []))
			data['_sort_ts'] = parse_timestamp(data.get('timestamp'))
			records.append(data)

	records.sort(key=lambda item: item.get('_sort_ts', 0.0))
	return records



fig, axes = plt.subplots(WINDOWS_TO_SHOW, 1, figsize=(10, 3 * WINDOWS_TO_SHOW), sharex=True)
if WINDOWS_TO_SHOW == 1:
	axes = [axes]
