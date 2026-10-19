from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import current_user
from app.core.errors import ApiError
from app.db.session import get_db
from app.models import Assessment, User
from app.schemas.assessment import (
    AssessmentOut,
    AssessmentPage,
    PredictionOut,
    SaveAssessmentIn,
)
from app.services.model_service import ModelService, require_model
from app.services.predict_service import run_prediction

router = APIRouter(prefix="/assessments", tags=["assessments"])


class SavedOut(PredictionOut):
    id: int


@router.post("", response_model=SavedOut, status_code=201)
def save_assessment(body: SaveAssessmentIn, user: User = Depends(current_user),
                    svc: ModelService = Depends(require_model), db: Session = Depends(get_db)):
    if body.consent is not True:
        raise ApiError(400, "consent_required", "Consent is required to save an assessment.")
    out, score = run_prediction(svc, body.inputs)
    row = Assessment(user_id=user.id, inputs=body.inputs.model_dump(), score=score, threshold=out.threshold,
                     category=out.category, model_version=out.model_version, consent_at=datetime.now(UTC))
    db.add(row)
    db.commit()
    return SavedOut(**out.model_dump(), id=row.id)


@router.get("", response_model=AssessmentPage)
def list_assessments(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0),
                     user: User = Depends(current_user), db: Session = Depends(get_db)):
    q = select(Assessment).where(Assessment.user_id == user.id)
    total = db.scalar(select(func.count()).select_from(q.subquery()))
    items = db.scalars(q.order_by(Assessment.created_at.desc(), Assessment.id.desc()).limit(limit).offset(offset)).all()
    return AssessmentPage(items=items, total=total, limit=limit, offset=offset)


def _own(db: Session, user: User, assessment_id: int) -> Assessment:
    row = db.scalar(select(Assessment).where(Assessment.id == assessment_id, Assessment.user_id == user.id))
    if row is None:  # 404, not 403: do not reveal that another user's record exists
        raise ApiError(404, "not_found", "Assessment not found.")
    return row


@router.get("/{assessment_id}", response_model=AssessmentOut)
def get_assessment(assessment_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return _own(db, user, assessment_id)


@router.delete("/{assessment_id}", status_code=204)
def delete_assessment(assessment_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.delete(_own(db, user, assessment_id))
    db.commit()
    return Response(status_code=204)


@router.delete("", status_code=204)
def delete_all(user: User = Depends(current_user), db: Session = Depends(get_db)):
    for row in db.scalars(select(Assessment).where(Assessment.user_id == user.id)).all():
        db.delete(row)
    db.commit()
    return Response(status_code=204)
