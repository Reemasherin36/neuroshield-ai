from app.main import app
from fastapi.testclient import TestClient


def test_health_reports_model_state():
    with TestClient(app) as client:
        r = client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert isinstance(body["model_loaded"], bool)


def test_unknown_route_uses_error_format():
    with TestClient(app) as client:
        r = client.get("/api/v1/nope")
    assert r.status_code == 404
    assert "error" in r.json()
