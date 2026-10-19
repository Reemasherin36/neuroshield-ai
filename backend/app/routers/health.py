from fastapi import APIRouter

from app.services.model_service import model_service

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "model_loaded": model_service.loaded, "model_message": model_service.error}
