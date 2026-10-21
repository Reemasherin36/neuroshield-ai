import pandas as pd

from app.schemas.assessment import AssessmentInput, ExplainFactor, ExplainOut, PredictionOut
from app.services.model_service import ModelService
from ml import config
from ml.predict import predict_one

DISCLAIMER = ("Experimental educational output, not a diagnosis. It cannot diagnose or rule out a stroke. "
              "Talk to a qualified healthcare professional. If you suspect a stroke, call emergency services now.")


def run_prediction(svc: ModelService, data: AssessmentInput) -> tuple[PredictionOut, float]:
    res = predict_one(svc.pipeline, svc.card, data.model_dump())
    supported = bool(svc.metrics.get("probability_display_supported", False))
    out = PredictionOut(
        category=res["category"], probability=res["score"] if supported else None,
        probability_display_supported=supported, threshold=res["threshold"],
        model_version=res["model_version"], disclaimer=DISCLAIMER)
    return out, res["score"]


EXPLAIN_METHOD = (
    "Each answer is swapped, one at a time, for the typical value in the training data "
    "(median for numbers, most common for categories). The change in the estimate is that answer's effect. "
    "Effects interact, so they do not add up exactly."
)


def run_explanation(svc: ModelService, data: AssessmentInput) -> ExplainOut:
    """Stateless: scores the person, then re-scores with each answer replaced by the typical value."""
    base = data.model_dump()
    typical = svc.reference["values"]
    rows = [base] + [{**base, f: typical[f]} for f in config.FEATURES]
    probs = svc.pipeline.predict_proba(pd.DataFrame(rows)[config.FEATURES])[:, 1]
    full = float(probs[0])
    factors = [
        ExplainFactor(feature=f, value=base[f], typical=typical[f], effect=full - float(probs[i + 1]))
        for i, f in enumerate(config.FEATURES)
    ]
    factors.sort(key=lambda x: abs(x.effect), reverse=True)
    pred, _ = run_prediction(svc, data)
    return ExplainOut(**pred.model_dump(), factors=factors, method=EXPLAIN_METHOD)
