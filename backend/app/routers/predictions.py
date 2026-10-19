from fastapi import APIRouter, Depends

from app.schemas.assessment import AssessmentInput, PredictionOut
from app.services.model_service import ModelService, require_model
from app.services.predict_service import run_prediction

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post("", response_model=PredictionOut)
def predict(data: AssessmentInput, svc: ModelService = Depends(require_model)):
    """Stateless: nothing is stored."""
    out, _ = run_prediction(svc, data)
    return out
