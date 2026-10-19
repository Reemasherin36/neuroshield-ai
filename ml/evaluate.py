"""Evaluate the saved model on the held-out TEST set (run once, after model + threshold are fixed)."""
import json
import sys

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from sklearn.calibration import calibration_curve
from sklearn.dummy import DummyClassifier
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)

from ml import config
from ml.prepare_data import SetupRequired, get_splits, load_data


def scores(y, p, thr):
    pred = (p >= thr).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred).ravel()
    return {
        "recall": float(recall_score(y, pred)), "precision": float(precision_score(y, pred, zero_division=0)),
        "f1": float(f1_score(y, pred)), "specificity": float(tn / (tn + fp)),
        "roc_auc": float(roc_auc_score(y, p)), "pr_auc": float(average_precision_score(y, p)),
        "brier": float(brier_score_loss(y, p)),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }


def main() -> None:
    df = load_data()
    (X_tr, y_tr), _, (X_te, y_te) = get_splits(df)
    model = joblib.load(config.ARTIFACTS_DIR / "pipeline.joblib")
    card = json.loads((config.ARTIFACTS_DIR / "model_card.json").read_text())
    thr = card["threshold"]
    p = model.predict_proba(X_te)[:, 1]
    m = scores(y_te, p, thr)
    dummy = DummyClassifier(strategy="prior").fit(X_tr, y_tr)
    m["brier_baseline_prevalence"] = float(brier_score_loss(y_te, dummy.predict_proba(X_te)[:, 1]))
    m["dummy_baseline"] = {"strategy": "predict training prevalence",
                           "pr_auc": float(average_precision_score(y_te, dummy.predict_proba(X_te)[:, 1])),
                           "roc_auc": float(roc_auc_score(y_te, dummy.predict_proba(X_te)[:, 1]))}
    frac_pos, mean_pred = calibration_curve(y_te, p, n_bins=5, strategy="quantile")
    bins = np.array_split(np.argsort(p), 5)
    ece = float(sum(len(b) / len(p) * abs(y_te.values[b].mean() - p[b].mean()) for b in bins))
    fpr, tpr, _ = roc_curve(y_te, p)
    pr_p, pr_r, _ = precision_recall_curve(y_te, p)
    m.update({
        "n_test": len(y_te), "n_test_positive": int(y_te.sum()), "threshold": thr,
        "ece_5_quantile_bins": ece,
        "probability_display_supported": bool(ece <= config.MAX_ECE_FOR_PROBABILITY
                                              and m["brier"] < m["brier_baseline_prevalence"]),
        "probability_display_criterion": f"ECE <= {config.MAX_ECE_FOR_PROBABILITY} and Brier < prevalence baseline",
        "calibration_curve": {"mean_predicted": mean_pred.tolist(), "fraction_positive": frac_pos.tolist()},
        "roc_curve": {"fpr": fpr.tolist(), "tpr": tpr.tolist()},
        "pr_curve": {"precision": pr_p.tolist(), "recall": pr_r.tolist()},
        "model_name": card["model_name"], "model_version": card["model_version"],
    })
    (config.ARTIFACTS_DIR / "metrics.json").write_text(json.dumps(m, indent=2))

    fig, axes = plt.subplots(1, 3, figsize=(12, 3.6))
    axes[0].plot(fpr, tpr, color="#0f766e"); axes[0].plot([0, 1], [0, 1], "--", color="gray")
    axes[0].set(title="ROC (test)", xlabel="FPR", ylabel="TPR")
    axes[1].plot(pr_r, pr_p, color="#0b2545"); axes[1].axhline(y_te.mean(), ls="--", color="gray")
    axes[1].set(title="Precision-Recall (test)", xlabel="Recall", ylabel="Precision")
    axes[2].plot(mean_pred, frac_pos, "o-", color="#0f766e"); axes[2].plot([0, 1], [0, 1], "--", color="gray")
    axes[2].set(title="Calibration (test, 5 quantile bins)", xlabel="Mean predicted", ylabel="Observed fraction")
    fig.tight_layout(); fig.savefig(config.ARTIFACTS_DIR / "eval_curves.png", dpi=120); plt.close(fig)

    keys = ["recall", "precision", "f1", "specificity", "roc_auc", "pr_auc", "brier"]
    print({k: round(m[k], 4) for k in keys})
    print("confusion:", m["confusion_matrix"], "| test n:", m["n_test"], "positives:", m["n_test_positive"])
    print("dummy:", m["dummy_baseline"], "| brier baseline:", round(m["brier_baseline_prevalence"], 4))
    print("ECE:", round(ece, 4), "| probability display supported:", m["probability_display_supported"])


if __name__ == "__main__":
    try:
        main()
    except (SetupRequired, FileNotFoundError) as e:
        print("SETUP REQUIRED:", e); sys.exit(1)
