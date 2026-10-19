"""Central paths, seed and thresholds for the ML pipeline."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
ARTIFACTS_DIR = ROOT / "artifacts"
SEED = 42
SPLIT = {"train": 0.6, "val": 0.2, "test": 0.2}
TARGET_RECALL = 0.80  # documented criterion: min recall on validation set
REQUIRED_COLUMNS = [
    "id", "gender", "age", "hypertension", "heart_disease", "ever_married",
    "work_type", "Residence_type", "avg_glucose_level", "bmi",
    "smoking_status", "stroke",
]

FEATURES_NUMERIC = ["age", "avg_glucose_level", "bmi"]
FEATURES_BINARY = ["hypertension", "heart_disease"]
FEATURES_CATEGORICAL = ["gender", "ever_married", "work_type", "Residence_type", "smoking_status"]
FEATURES = FEATURES_NUMERIC + FEATURES_BINARY + FEATURES_CATEGORICAL
TARGET = "stroke"
MODEL_VERSION = "0.1.0"
# Display categories are relative to the decision threshold (a documented, arbitrary UI choice):
# lower: p < LOWER_FRACTION * threshold; moderate: up to threshold; higher: >= threshold.
LOWER_FRACTION = 0.5
# Calibration is judged "good enough to show a percentage" only if both hold on the test set:
MAX_ECE_FOR_PROBABILITY = 0.03
