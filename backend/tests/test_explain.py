import pytest
from app.db.session import SessionLocal
from app.models import Assessment
from app.services.model_service import model_service
from sqlalchemy import func, select

from tests.conftest import VALID

TYPICAL = {"age": 45, "gender": "Female", "hypertension": 0, "heart_disease": 0, "ever_married": "Yes", "work_type": "Private",
           "Residence_type": "Rural", "avg_glucose_level": 91.665, "bmi": 28, "smoking_status": "never smoked"}


@pytest.fixture()
def ref_ready(client, model_ready):
    """Checked after startup, because the app loads the model and reference file in its lifespan."""
    if not model_service.reference:
        pytest.skip("reference_profile.json missing; run python -m ml.summarize")


def test_explain_returns_all_features_sorted_by_effect(client, ref_ready):
    r = client.post("/api/v1/predictions/explain", json=VALID)
    assert r.status_code == 200
    body = r.json()
    assert len(body["factors"]) == 10
    assert {f["feature"] for f in body["factors"]} == set(VALID)
    effects = [abs(f["effect"]) for f in body["factors"]]
    assert effects == sorted(effects, reverse=True)
    assert "do not add up exactly" in body["method"]


def test_explain_matches_the_plain_prediction(client, ref_ready):
    plain = client.post("/api/v1/predictions", json=VALID).json()
    ex = client.post("/api/v1/predictions/explain", json=VALID).json()
    for key in ("category", "probability", "threshold", "model_version"):
        assert ex[key] == plain[key]


def test_older_age_and_high_glucose_raise_the_estimate(client, ref_ready):
    ex = client.post("/api/v1/predictions/explain", json=VALID).json()
    effect = {f["feature"]: f["effect"] for f in ex["factors"]}
    assert effect["age"] > 0 and effect["avg_glucose_level"] > 0
    assert ex["factors"][0]["feature"] == "age"  # age 67 vs typical 45 is the dominant driver for this profile


def test_a_typical_person_has_no_effects(client, ref_ready):
    ex = client.post("/api/v1/predictions/explain", json=TYPICAL).json()
    assert all(f["effect"] == pytest.approx(0, abs=1e-9) for f in ex["factors"])


def test_explain_is_stateless_and_validates_input(client, ref_ready):
    assert client.post("/api/v1/predictions/explain", json=VALID).status_code == 200
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(Assessment)) == 0
    bad = client.post("/api/v1/predictions/explain", json={**VALID, "bmi": 500})
    assert bad.status_code == 422 and "500" not in bad.text


def test_explain_needs_the_reference_file(client, model_ready, monkeypatch):
    monkeypatch.setattr(model_service, "reference", None)
    r = client.post("/api/v1/predictions/explain", json=VALID)
    assert r.status_code == 503 and r.json()["error"]["code"] == "reference_unavailable"
    assert "ml.summarize" in r.json()["error"]["message"]
    assert client.post("/api/v1/predictions", json=VALID).status_code == 200  # the plain prediction still works


def test_explain_without_a_model_is_503(client, monkeypatch):
    monkeypatch.setattr(model_service, "pipeline", None)
    monkeypatch.setattr(model_service, "error", "Model not trained yet.")
    r = client.post("/api/v1/predictions/explain", json=VALID)
    assert r.status_code == 503 and r.json()["error"]["code"] == "model_unavailable"
