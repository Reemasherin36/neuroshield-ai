from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AssessmentInput(BaseModel):
    """Categories must match the training data exactly."""

    model_config = ConfigDict(extra="forbid")
    age: float = Field(ge=0, le=120, allow_inf_nan=False)
    gender: Literal["Male", "Female", "Other"]
    hypertension: Literal[0, 1]
    heart_disease: Literal[0, 1]
    ever_married: Literal["Yes", "No"]
    work_type: Literal["Private", "Self-employed", "Govt_job", "children", "Never_worked"]
    Residence_type: Literal["Urban", "Rural"]
    avg_glucose_level: float = Field(ge=40, le=500, allow_inf_nan=False)
    bmi: float = Field(ge=10, le=80, allow_inf_nan=False)
    smoking_status: Literal["never smoked", "formerly smoked", "smokes", "Unknown"]


class SaveAssessmentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    inputs: AssessmentInput
    consent: bool


class PredictionOut(BaseModel):
    category: Literal["lower", "moderate", "higher"]
    probability: float | None  # only when the evaluated calibration supports showing it
    probability_display_supported: bool
    threshold: float
    model_version: str
    disclaimer: str


class AssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    inputs: dict
    score: float
    threshold: float
    category: str
    model_version: str
    consent_at: datetime
    created_at: datetime


class AssessmentPage(BaseModel):
    items: list[AssessmentOut]
    total: int
    limit: int
    offset: int
