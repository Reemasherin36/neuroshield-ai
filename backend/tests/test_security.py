"""Security behaviour: token handling, headers, error hygiene, startup guard."""
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from app.core.config import settings
from app.main import app
from fastapi.testclient import TestClient

from tests.conftest import PW, VALID, make_user


def _token(sub, minutes=30, secret=None, alg="HS256"):
    now = datetime.now(UTC)
    payload = {"sub": str(sub), "iat": now, "exp": now + timedelta(minutes=minutes)}
    return jwt.encode(payload, secret or settings.jwt_secret, algorithm=alg)


def _with_cookie(token):
    c = TestClient(app)
    c.cookies.set("access_token", token)
    return c


def test_tampered_or_foreign_tokens_are_rejected(client):
    make_user(client)
    assert _with_cookie(_token(1)).get("/api/v1/users/me").status_code == 200  # control: a correctly signed token works
    assert _with_cookie(_token(1, secret="a-different-signing-secret-of-32-chars!!")).get("/api/v1/users/me").status_code == 401
    assert _with_cookie(_token(1)[:-3] + "abc").get("/api/v1/users/me").status_code == 401
    assert _with_cookie("not-a-jwt").get("/api/v1/users/me").status_code == 401


def test_expired_token_is_rejected(client):
    make_user(client)
    assert _with_cookie(_token(1, minutes=-5)).get("/api/v1/users/me").status_code == 401


def test_alg_none_token_is_rejected(client):
    make_user(client)
    unsigned = jwt.encode({"sub": "1", "exp": datetime.now(UTC) + timedelta(minutes=5)}, key=None, algorithm="none")
    assert _with_cookie(unsigned).get("/api/v1/users/me").status_code == 401


def test_token_for_deleted_user_stops_working(client):
    c = make_user(client)
    assert c.request("DELETE", "/api/v1/users/me", json={"password": PW}).status_code == 204
    assert _with_cookie(_token(1)).get("/api/v1/users/me").status_code == 401


def test_token_for_other_user_id_does_not_grant_access_to_my_data(client, model_ready):
    a = make_user(client, "a@example.com")
    make_user(client, "b@example.com")
    aid = a.post("/api/v1/assessments", json={"inputs": VALID, "consent": True}).json()["id"]
    b = _with_cookie(_token(2))
    assert b.get(f"/api/v1/assessments/{aid}").status_code == 404


def test_logout_clears_cookie(client):
    c = make_user(client)
    r = c.post("/api/v1/auth/logout")
    assert r.status_code == 204
    set_cookie = r.headers["set-cookie"].lower()
    assert "access_token=" in set_cookie and ("max-age=0" in set_cookie or "expires=" in set_cookie)


def test_security_headers_on_every_response(client):
    for r in (client.get("/api/v1/health"), client.get("/api/v1/nope"), client.post("/api/v1/auth/login", json={})):
        assert r.headers["x-content-type-options"] == "nosniff"
        assert r.headers["x-frame-options"] == "DENY"
        assert r.headers["referrer-policy"] == "no-referrer"
        assert r.headers["cache-control"] == "no-store"


def test_cors_allows_only_the_frontend_origin(client):
    ok = client.get("/api/v1/health", headers={"Origin": settings.frontend_origin})
    assert ok.headers.get("access-control-allow-origin") == settings.frontend_origin
    assert ok.headers.get("access-control-allow-credentials") == "true"
    bad = client.get("/api/v1/health", headers={"Origin": "http://evil.example"})
    assert "access-control-allow-origin" not in bad.headers


def test_password_hash_never_returned(client):
    c = make_user(client)
    login = c.post("/api/v1/auth/login", json={"email": "a@example.com", "password": PW})
    for body in (c.get("/api/v1/users/me").text, login.text):
        assert "password" not in body.lower() and "argon2" not in body.lower()


def test_validation_errors_do_not_echo_health_data(client):
    secret_marker = 987.654
    r = client.post("/api/v1/predictions", json={**VALID, "bmi": secret_marker, "age": 9999})
    assert r.status_code == 422
    assert str(secret_marker) not in r.text and "9999" not in r.text


def test_unexpected_server_error_is_generic(client, monkeypatch):
    from app.services import model_service as ms

    def boom(*a, **k):
        raise RuntimeError("secret internal detail /etc/passwd")

    monkeypatch.setattr("app.routers.predictions.run_prediction", boom)
    monkeypatch.setattr(ms.model_service, "pipeline", object())
    safe = TestClient(app, raise_server_exceptions=False)
    r = safe.post("/api/v1/predictions", json=VALID)
    assert r.status_code == 500
    assert "secret internal detail" not in r.text and "passwd" not in r.text


def test_production_refuses_default_secret(monkeypatch):
    monkeypatch.setattr(settings, "app_env", "production")
    monkeypatch.setattr(settings, "jwt_secret", "CHANGE_ME_TO_A_LONG_RANDOM_STRING")
    with pytest.raises(RuntimeError, match="JWT_SECRET"), TestClient(app):
        pass


def test_production_cookie_is_secure(client, monkeypatch):
    monkeypatch.setattr(settings, "app_env", "production")
    r = TestClient(app).post("/api/v1/auth/register", json={"email": "prod@example.com", "password": PW})
    assert "secure" in r.headers["set-cookie"].lower()


def test_form_encoded_and_text_bodies_are_rejected(client, model_ready):
    """State-changing endpoints accept JSON only, which a cross-site HTML form cannot send."""
    for ctype in ("application/x-www-form-urlencoded", "text/plain"):
        r = client.post("/api/v1/predictions", content="age=67&bmi=30", headers={"Content-Type": ctype})
        assert r.status_code == 422, ctype
