"""Prediction helper used by the backend. Predictions only ever come from the saved pipeline."""
import json

import joblib
import pandas as pd

from ml import config


def load_artifacts(artifacts_dir=config.ARTIFACTS_DIR):
    pipe = joblib.load(artifacts_dir / "pipeline.joblib")
    card = json.loads((artifacts_dir / "model_card.json").read_text())
    return pipe, card


def category_for(p: float, threshold: float) -> str:
    if p >= threshold:
        return "higher"
    return "lower" if p < config.LOWER_FRACTION * threshold else "moderate"


def predict_one(pipe, card, record: dict) -> dict:
    X = pd.DataFrame([record])[config.FEATURES]
    p = float(pipe.predict_proba(X)[0, 1])
    return {"score": p, "threshold": card["threshold"], "category": category_for(p, card["threshold"]),
            "model_version": card["model_version"]}
