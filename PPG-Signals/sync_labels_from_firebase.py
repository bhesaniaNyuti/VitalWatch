import csv
from typing import Dict, List, Optional, Tuple

import pandas as pd
import requests

FIREBASE_URL = "https://bpmonitor-c6128-default-rtdb.firebaseio.com/readings.json"
CSV_PATH = "accepted_windows.csv"


def _clean_text(v) -> str:
	return str(v).strip().strip('"').strip("'")


def _to_float(v) -> Optional[float]:
	try:
		out = float(v)
	except Exception:
		return None
	return out


def _signal_to_csv_cell(v) -> str:
	if isinstance(v, list):
		return ",".join(str(x) for x in v)
	if isinstance(v, dict):
		try:
			keys = sorted(v.keys(), key=lambda k: int(k) if str(k).isdigit() else str(k))
		except Exception:
			keys = sorted(v.keys())
		return ",".join(str(v[k]) for k in keys)
	return _clean_text(v)


def _load_csv_robust(path: str) -> pd.DataFrame:
	try:
		return pd.read_csv(path)
	except Exception:
		rows: List[Dict[str, str]] = []
		with open(path, "r", encoding="utf-8", errors="replace", newline="") as f:
			lines = f.read().splitlines()

		if not lines:
			return pd.DataFrame()

		header = [h.strip().strip('"') for h in lines[0].split(",")]
		col_names = header[:7] + ["filtered_values"]

		for line in lines[1:]:
			text = line.strip()
			if not text:
				continue
			parts = text.split(",", 7)
			if len(parts) < 8:
				parts += [""] * (8 - len(parts))
			rows.append(
				{
					col_names[i]: _clean_text(parts[i]) if i < 7 else parts[i].strip()
					for i in range(8)
				}
			)

		return pd.DataFrame(rows, columns=col_names)


def _fetch_firebase_records(url: str) -> Dict[str, Dict[str, object]]:
	resp = requests.get(url, timeout=20)
	resp.raise_for_status()
	payload = resp.json() or {}

	out: Dict[str, Dict[str, object]] = {}
	if not isinstance(payload, dict):
		return out

	for key, val in payload.items():
		if not isinstance(val, dict):
			continue
		wid = _clean_text(val.get("window_id", key))
		sbp = _to_float(val.get("SBP", val.get("sbp", None)))
		dbp = _to_float(val.get("DBP", val.get("dbp", None)))
		bpm = _to_float(val.get("bpm", None))
		spo2 = _to_float(val.get("spo2", None))
		sample_count = _to_float(val.get("sample_count", None))
		timestamp = _clean_text(val.get("timestamp", ""))
		ir_data = val.get("ir_data", val.get("IR", ""))

		out[wid] = {
			"sbp": sbp,
			"dbp": dbp,
			"bpm": bpm,
			"spo2": spo2,
			"sample_count": sample_count,
			"timestamp": timestamp,
			"signal": _signal_to_csv_cell(ir_data),
		}

	return out


def main() -> None:
	df = _load_csv_robust(CSV_PATH)
	if df.empty:
		print("CSV is empty or unreadable.")
		return

	if "window_id" not in df.columns:
		raise RuntimeError("accepted_windows.csv is missing window_id column")

	if "sbp" not in df.columns:
		df["sbp"] = None
	if "dbp" not in df.columns:
		df["dbp"] = None

	df["window_id"] = df["window_id"].astype(str).map(_clean_text)
	df["sbp"] = pd.to_numeric(df["sbp"], errors="coerce")
	df["dbp"] = pd.to_numeric(df["dbp"], errors="coerce")

	fb_records = _fetch_firebase_records(FIREBASE_URL)

	updated = 0
	checked_overlap = 0
	appended = 0

	local_ids = set(df["window_id"].astype(str).map(_clean_text))

	for i, row in df.iterrows():
		wid = _clean_text(row["window_id"])
		if wid not in fb_records:
			continue

		checked_overlap += 1
		rec = fb_records[wid]
		fb_sbp = rec["sbp"]
		fb_dbp = rec["dbp"]
		if fb_sbp is None or fb_dbp is None:
			continue
		if fb_sbp <= 0 or fb_dbp <= 0:
			continue

		local_sbp = row["sbp"]
		local_dbp = row["dbp"]
		local_missing = pd.isna(local_sbp) or pd.isna(local_dbp) or local_sbp <= 0 or local_dbp <= 0
		if local_missing:
			df.at[i, "sbp"] = float(fb_sbp)
			df.at[i, "dbp"] = float(fb_dbp)
			updated += 1

		# Also backfill signal/timestamp fields if missing.
		if "filtered_values" in df.columns:
			cur_sig = _clean_text(df.at[i, "filtered_values"]) if pd.notna(df.at[i, "filtered_values"]) else ""
			if (not cur_sig) and rec.get("signal"):
				df.at[i, "filtered_values"] = rec["signal"]

		if "signal_len" in df.columns:
			cur_len = pd.to_numeric(df.at[i, "signal_len"], errors="coerce")
			if pd.isna(cur_len) or cur_len <= 0:
				sig_txt = _clean_text(df.at[i, "filtered_values"]) if "filtered_values" in df.columns else ""
				if sig_txt:
					df.at[i, "signal_len"] = len([x for x in sig_txt.split(",") if _clean_text(x)])
				elif rec.get("sample_count"):
					df.at[i, "signal_len"] = int(rec["sample_count"])

	# Append missing Firebase records that are not in CSV.
	for wid, rec in fb_records.items():
		if wid in local_ids:
			continue

		sig_txt = _clean_text(rec.get("signal", ""))
		if not sig_txt:
			continue

		row = {
			"window_id": wid,
			"timestamp": rec.get("timestamp", ""),
			"bpm": rec.get("bpm", ""),
			"spo2": rec.get("spo2", ""),
			"sbp": rec.get("sbp", ""),
			"dbp": rec.get("dbp", ""),
			"signal_len": int(rec["sample_count"]) if rec.get("sample_count") else len([x for x in sig_txt.split(",") if _clean_text(x)]),
			"filtered_values": sig_txt,
		}
		df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)
		local_ids.add(wid)
		appended += 1

	# Keep expected file column order used in this project.
	ordered = [
		"window_id",
		"timestamp",
		"bpm",
		"spo2",
		"sbp",
		"dbp",
		"signal_len",
		"filtered_values",
	]
	for c in ordered:
		if c not in df.columns:
			df[c] = ""

	# Recompute signal_len from filtered_values for consistency.
	for i, row in df.iterrows():
		sig_txt = _clean_text(row.get("filtered_values", ""))
		if sig_txt:
			df.at[i, "signal_len"] = len([x for x in sig_txt.split(",") if _clean_text(x)])
	df = df[ordered]

	df.to_csv(CSV_PATH, index=False, quoting=csv.QUOTE_NONNUMERIC)

	usable = int(((pd.to_numeric(df["sbp"], errors="coerce") > 0) & (pd.to_numeric(df["dbp"], errors="coerce") > 0)).sum())
	print(f"Rows in CSV: {len(df)}")
	print(f"Overlapping window_ids with Firebase: {checked_overlap}")
	print(f"Rows updated from Firebase labels: {updated}")
	print(f"Rows appended from Firebase: {appended}")
	print(f"Rows now with positive sbp/dbp: {usable}")


if __name__ == "__main__":
	main()
