"""Train + select a model using train (CV) and validation data only. The test set is not touched here."""
import json
import sys
from datetime import UTC, datetime

import joblib
import numpy as np
import sklearn
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    precision_recall_curve,
    roc_auc_score,
)
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from ml import config
from ml.prepare_data import SetupRequired, file_hash, find_csv, get_splits, load_data


def make_pipeline(clf) -> Pipeline:
    pre = ColumnTransformer([
        ("num", Pipeline([("imp", SimpleImputer(strategy="median", add_indicator=True)),
                          ("sc", StandardScaler())]), config.FEATURES_NUMERIC),
        ("bin", "passthrough", config.FEATURES_BINARY),
        ("cat", OneHotEncoder(handle_unknown="ignore"), config.FEATURES_CATEGORICAL),
    ])
    return Pipeline([("pre", pre), ("clf", clf)])


CANDIDATES = {
    "logistic_regression": (
        LogisticRegression(class_weight="balanced", max_iter=2000),
        {"clf__C": [0.01, 0.1, 1.0]}),
    "random_forest": (
        RandomForestClassifier(n_estimators=300, class_weight="balanced_subsample",
                               random_state=config.SEED, n_jobs=-1),
        {"clf__max_depth": [4, 8], "clf__min_samples_leaf": [5, 20]}),
    "hist_gradient_boosting": (
        HistGradientBoostingClassifier(class_weight="balanced", random_state=config.SEED),
        {"clf__learning_rate": [0.03, 0.1], "clf__max_depth": [2, 3], "clf__l2_regularization": [0.0, 1.0]}),
}


def pick_threshold(y_val, p_val, target_recall):
    """Highest-precision threshold whose validation recall >= target_recall."""
    prec, rec, thr = precision_recall_curve(y_val, p_val)
    ok = np.where(rec[:-1] >= target_recall)[0]
    best = ok[np.argmax(prec[:-1][ok])]
    return float(thr[best]), float(prec[best]), float(rec[best])


def main() -> None:
    df = load_data()
    (X_tr, y_tr), (X_val, y_val), _ = get_splits(df)  # test split intentionally unused
    cv = StratifiedKFold(5, shuffle=True, random_state=config.SEED)
    results, fitted = {}, {}
    for name, (clf, grid) in CANDIDATES.items():
        gs = GridSearchCV(make_pipeline(clf), grid, scoring="average_precision", cv=cv, n_jobs=-1).fit(X_tr, y_tr)
        cal = CalibratedClassifierCV(gs.best_estimator_, method="sigmoid", cv=cv).fit(X_tr, y_tr)
        p_val = cal.predict_proba(X_val)[:, 1]
        results[name] = {
            "best_params": {k: (v if isinstance(v, (int, float, str)) else str(v)) for k, v in gs.best_params_.items()},
            "cv_pr_auc_mean": float(gs.best_score_),
            "val_pr_auc": float(average_precision_score(y_val, p_val)),
            "val_roc_auc": float(roc_auc_score(y_val, p_val)),
        }
        fitted[name] = cal
        print(name, json.dumps(results[name]))
    best = max(results, key=lambda n: results[n]["val_pr_auc"])  # select by PR-AUC on validation, not accuracy
    model = fitted[best]
    p_val = model.predict_proba(X_val)[:, 1]
    thr, prec, rec = pick_threshold(y_val, p_val, config.TARGET_RECALL)

    imp = permutation_importance(model, X_val, y_val, scoring="average_precision",
                                 n_repeats=20, random_state=config.SEED)
    importance = sorted(
        [{"feature": f, "mean": float(m), "std": float(s)}
         for f, m, s in zip(config.FEATURES, imp.importances_mean, imp.importances_std, strict=True)],
        key=lambda d: -d["mean"])

    config.ARTIFACTS_DIR.mkdir(exist_ok=True)
    joblib.dump(model, config.ARTIFACTS_DIR / "pipeline.joblib")
    (config.ARTIFACTS_DIR / "model_selection.json").write_text(json.dumps(
        {"selected": best, "selection_criterion": "validation PR-AUC", "candidates": results}, indent=2))
    (config.ARTIFACTS_DIR / "feature_importance.json").write_text(json.dumps(
        {"method": "permutation importance on validation set, scoring=average_precision, 20 repeats",
         "importances": importance}, indent=2))
    (config.ARTIFACTS_DIR / "model_card.json").write_text(json.dumps({
        "model_name": best, "model_version": config.MODEL_VERSION, "sklearn_version": sklearn.__version__,
        "training_date": datetime.now(UTC).isoformat(), "dataset_sha256": file_hash(find_csv()),
        "threshold": thr, "threshold_criterion": f"max validation precision subject to recall >= {config.TARGET_RECALL}",
        "validation_precision_at_threshold": prec, "validation_recall_at_threshold": rec,
        "features": config.FEATURES, "calibration": "sigmoid, 5-fold on training data",
        "limitations": ["Educational prototype, not a diagnostic tool.",
                        "Few positive cases; estimates are noisy.",
                        "Dataset provenance is limited and not a clinical cohort."]}, indent=2))
    print(f"selected={best} threshold={thr:.4f} val_precision={prec:.3f} val_recall={rec:.3f}")


if __name__ == "__main__":
    try:
        main()
    except SetupRequired as e:
        print("SETUP REQUIRED:", e); sys.exit(1)
