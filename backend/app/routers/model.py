from fastapi import APIRouter, Depends

from app.services.model_service import ModelService, require_model

router = APIRouter(prefix="/model", tags=["model"])


@router.get("/metadata")
def metadata(svc: ModelService = Depends(require_model)):
    c = svc.card
    keys = ["model_name", "model_version", "sklearn_version", "training_date", "dataset_sha256",
            "threshold", "threshold_criterion", "features", "calibration", "limitations"]
    return {**{k: c[k] for k in keys}, "dataset_summary": svc.summary}


@router.get("/metrics")
def metrics(svc: ModelService = Depends(require_model)):
    return svc.metrics


@router.get("/feature-importance")
def feature_importance(svc: ModelService = Depends(require_model)):
    return {**svc.importance, "limitations": [
        "Permutation importance measures how much this model relies on a feature on the validation set.",
        "It is not causal and does not show that a feature does or does not matter medically.",
        "Few positive cases make these values noisy; correlated features can share or hide importance."]}
