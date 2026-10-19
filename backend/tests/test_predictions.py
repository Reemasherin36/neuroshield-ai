import pytest
from app.services.model_service import model_service

from tests.conftest import VALID


def test_prediction_valid(client, model_ready):
    r = client.post("/api/v1/predictions", json=VALID)
    assert r.status_code == 200
    body = r.json()
    assert body["category"] in {"lower", "moderate", "higher"}
    assert "not a diagnosis" in body["disclaimer"]
    if body["probability_display_supported"]:
        assert 0 <= body["probability"] <= 1
    else:
        assert body["probability"] is None


def test_prediction_is_stateless_and_deterministic(client, model_ready):
    a = client.post("/api/v1/predictions", json=VALID).json()
    b = client.post("/api/v1/predictions", json=VALID).json()
    assert a == b


@pytest.mark.parametrize("field,value", [
    ("age", -1), ("age", 121), ("avg_glucose_level", 39.9), ("avg_glucose_level", 500.1),
    ("bmi", 9.9), ("bmi", 80.1), ("gender", "Unknown"), ("smoking_status", "sometimes"),
    ("hypertension", 2), ("work_type", "Retired"), ("age", "abc"),
])
def test_prediction_invalid_inputs(client, field, value):
    r = client.post("/api/v1/predictions", json={**VALID, field: value})
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "validation_error"


@pytest.mark.parametrize("field,value", [("age", 0), ("age", 120), ("avg_glucose_level", 40),
                                         ("avg_glucose_level", 500), ("bmi", 10), ("bmi", 80)])
def test_prediction_boundaries_accepted(client, model_ready, field, value):
    assert client.post("/api/v1/predictions", json={**VALID, field: value}).status_code == 200


def test_missing_field_and_extra_field_rejected(client):
    partial = {k: v for k, v in VALID.items() if k != "bmi"}
    assert client.post("/api/v1/predictions", json=partial).status_code == 422
    assert client.post("/api/v1/predictions", json={**VALID, "is_admin": True}).status_code == 422


def test_missing_model_returns_503(client, monkeypatch):
    monkeypatch.setattr(model_service, "pipeline", None)
    monkeypatch.setattr(model_service, "error", "Model not trained yet.")
    for path in ["/api/v1/model/metrics", "/api/v1/model/metadata", "/api/v1/model/feature-importance"]:
        r = client.get(path)
        assert r.status_code == 503 and r.json()["error"]["code"] == "model_unavailable", path
    assert client.post("/api/v1/predictions", json=VALID).status_code == 503
    h = client.get("/api/v1/health").json()
    assert h["model_loaded"] is False and h["model_message"]


def test_model_endpoints_return_real_artifacts(client, model_ready):
    meta = client.get("/api/v1/model/metadata").json()
    assert meta["model_version"] and "limitations" in meta
    ds = meta["dataset_summary"]
    assert ds["rows"] == 5110
    assert sum(v["rows"] for v in ds["splits"].values()) == ds["rows"]
    m = client.get("/api/v1/model/metrics").json()
    assert {"recall", "precision", "roc_auc", "confusion_matrix"} <= m.keys()
    fi = client.get("/api/v1/model/feature-importance").json()
    assert fi["importances"] and fi["limitations"]
