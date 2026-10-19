import json

import joblib
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression

from ml import config
from ml.prepare_data import SetupRequired, find_csv, get_splits, load_data
from ml.train import make_pipeline

needs_data = pytest.mark.skipif(not list(config.DATA_DIR.glob("*.csv")), reason="dataset not in data/")
needs_model = pytest.mark.skipif(not (config.ARTIFACTS_DIR / "pipeline.joblib").exists(),
                                 reason="model not trained; run ml.train")


def test_missing_dataset_raises_setup_required(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DATA_DIR", tmp_path)
    with pytest.raises(SetupRequired):
        find_csv()


def test_missing_columns_rejected(tmp_path, monkeypatch):
    (tmp_path / "x.csv").write_text("id,age\n1,50\n")
    monkeypatch.setattr(config, "DATA_DIR", tmp_path)
    with pytest.raises(SetupRequired, match="missing required columns"):
        load_data()


@needs_data
def test_splits_are_disjoint_and_stratified():
    df = load_data()
    (a, ya), (b, _), (c, yc) = get_splits(df)
    assert not (set(a.index) & set(b.index)) and not (set(a.index) & set(c.index)) and not (set(b.index) & set(c.index))
    assert len(a) + len(b) + len(c) == len(df)
    assert abs(ya.mean() - df.stroke.mean()) < 0.005 and abs(yc.mean() - df.stroke.mean()) < 0.01


@needs_data
def test_preprocessor_fit_on_train_only():
    df = load_data()
    (X_tr, y_tr), _, _ = get_splits(df)
    pipe = make_pipeline(LogisticRegression(max_iter=500)).fit(X_tr, y_tr)
    num = pipe.named_steps["pre"].named_transformers_["num"]
    assert num["imp"].statistics_[2] == pytest.approx(X_tr["bmi"].median())
    assert num["sc"].mean_[0] == pytest.approx(X_tr["age"].mean())
    assert num["sc"].mean_[0] != pytest.approx(df["age"].mean(), abs=1e-9)


@needs_data
def test_pipeline_save_load_roundtrip(tmp_path):
    df = load_data()
    (X_tr, y_tr), _, (X_te, _) = get_splits(df)
    pipe = make_pipeline(LogisticRegression(max_iter=500)).fit(X_tr, y_tr)
    joblib.dump(pipe, tmp_path / "p.joblib")
    again = joblib.load(tmp_path / "p.joblib")
    assert (pipe.predict_proba(X_te) == again.predict_proba(X_te)).all()


@needs_model
def test_saved_model_predicts_probability():
    pipe = joblib.load(config.ARTIFACTS_DIR / "pipeline.joblib")
    row = pd.DataFrame([{"age": 67, "hypertension": 0, "heart_disease": 1, "ever_married": "Yes",
                         "work_type": "Private", "Residence_type": "Urban", "avg_glucose_level": 228.7,
                         "bmi": 36.6, "smoking_status": "formerly smoked", "gender": "Male"}])[config.FEATURES]
    assert 0.0 <= pipe.predict_proba(row)[0, 1] <= 1.0


@needs_model
def test_metrics_and_model_card_schema():
    m = json.loads((config.ARTIFACTS_DIR / "metrics.json").read_text())
    for k in ["recall", "precision", "f1", "specificity", "roc_auc", "pr_auc", "brier",
              "confusion_matrix", "roc_curve", "pr_curve", "calibration_curve", "threshold"]:
        assert k in m
    card = json.loads((config.ARTIFACTS_DIR / "model_card.json").read_text())
    for k in ["model_name", "model_version", "sklearn_version", "training_date", "dataset_sha256",
              "threshold", "features", "limitations"]:
        assert k in card
