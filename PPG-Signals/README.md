# PPG-Signals

This folder contains scripts and utilities to process PPG windows and prepare data for cuffless blood-pressure model training.

Important: This repository intentionally excludes raw signal data, trained model weights, and any sensitive records. Do NOT commit `*.npz`, `*.keras`, `*.h5`, or the `data/` and `models/` directories.

Included files:
- `ppg-signals.py`: preprocessing and window acceptance logic used to build `accepted_windows.csv`.
- `train_bp_from_local_ppg.py`: training pipeline (model definition and training loop).
- `sync_labels_from_firebase.py`: helper to backfill SBP/DBP labels from Firebase into CSV.
- `ARDUINO_FIXES.md`: notes and fixes for Arduino firmware used to collect data.

How to use (local only):
1. Place raw signal files and model artifacts outside the repo (or use Git LFS).
2. Run `sync_labels_from_firebase.py` to merge labels into `accepted_windows.csv`.
3. Use `ppg-signals.py` to filter windows and create `accepted_windows.csv` / `model_ready_live.npz`.
4. Train locally with `train_bp_from_local_ppg.py`.

If you need help moving large files to cloud storage, ask and I can provide steps.
