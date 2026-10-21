from fastapi import APIRouter, Depends

from app.schemas.assessment import AssessmentInput, ExplainOut, PredictionOut
from app.services.model_service import ModelService, require_model, require_reference
from app.services.predict_service import run_explanation, run_prediction

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post("", response_model=PredictionOut)
def predict(data: AssessmentInput, svc: ModelService = Depends(require_model)):
    """Stateless: nothing is stored."""
    out, _ = run_prediction(svc, data)
    return out


@router.post("/explain", response_model=ExplainOut)
def explain(data: AssessmentInput, svc: ModelService = Depends(require_reference)):
    """Stateless: the result plus how much each answer moves the estimate. Nothing is stored."""
    return run_explanation(svc, data)
