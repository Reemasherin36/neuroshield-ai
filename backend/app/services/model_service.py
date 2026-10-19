"""Loads the trained artifacts once. Never fabricates a model."""
import json
import sys
from pathlib import Path

from app.core.config import ROOT, settings

if str(ROOT) not in sys.path:  # lets the backend import the shared `ml` package
    sys.path.insert(0, str(ROOT))


class ModelService:
    def __init__(self) -> None:
        self.pipeline = None
        self.card: dict = {}
        self.metrics: dict = {}
        self.importance: dict = {}
        self.summary: dict | None = None
        self.error: str | None = None

    def load(self) -> None:
        self.pipeline, self.card, self.metrics, self.importance, self.summary = None, {}, {}, {}, None
        path = Path(settings.artifacts_dir)
        if not path.is_absolute():
            path = ROOT / path
        needed = ["pipeline.joblib", "model_card.json", "metrics.json", "feature_importance.json"]
        if any(not (path / n).exists() for n in needed):
            self.error = "Model not trained yet. Run scripts\\train.ps1 (see README)."
            return
        try:
            import joblib
            import sklearn

            card = json.loads((path / "model_card.json").read_text())
            if card["sklearn_version"].split(".")[:2] != sklearn.__version__.split(".")[:2]:
                self.error = (f"Model was trained with scikit-learn {card['sklearn_version']} but "
                              f"{sklearn.__version__} is installed. Retrain with scripts\\train.ps1.")
                return
            self.pipeline = joblib.load(path / "pipeline.joblib")
            self.card = card
            self.metrics = json.loads((path / "metrics.json").read_text())
            self.importance = json.loads((path / "feature_importance.json").read_text())
            summary_file = path / "data_summary.json"  # optional; older artifact sets may not have it
            self.summary = json.loads(summary_file.read_text()) if summary_file.exists() else None
            self.error = None
        except Exception as exc:  # noqa: BLE001 - any load failure must degrade to a 503 state
            self.pipeline = None
            self.error = f"Model artifacts could not be loaded ({type(exc).__name__}). Retrain the model."

    @property
    def loaded(self) -> bool:
        return self.pipeline is not None


model_service = ModelService()


def require_model() -> ModelService:
    from app.core.errors import ApiError

    if not model_service.loaded:
        raise ApiError(503, "model_unavailable", model_service.error or "Model unavailable.")
    return model_service
