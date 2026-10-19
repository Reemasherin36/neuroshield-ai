from app.schemas.assessment import AssessmentInput, PredictionOut
from app.services.model_service import ModelService
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
