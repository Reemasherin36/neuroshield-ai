from app.main import app
from fastapi.testclient import TestClient

from tests.conftest import PW, make_user


def test_register_login_me_logout(client):
    c = make_user(client)
    assert c.get("/api/v1/users/me").json()["email"] == "a@example.com"
    c.post("/api/v1/auth/logout")
    assert c.get("/api/v1/users/me").status_code == 401
    r = c.post("/api/v1/auth/login", json={"email": "A@Example.com", "password": PW})
    assert r.status_code == 200 and c.get("/api/v1/users/me").status_code == 200


def test_cookie_is_httponly_samesite(client):
    r = TestClient(app).post("/api/v1/auth/register", json={"email": "b@example.com", "password": PW})
    cookie = r.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=lax" in cookie


def test_register_validation_and_duplicates(client):
    make_user(client)
    c = TestClient(app)
    assert c.post("/api/v1/auth/register", json={"email": "a@example.com", "password": PW}).status_code == 409
    short = c.post("/api/v1/auth/register", json={"email": "c@example.com", "password": "short"})
    assert short.status_code == 422 and short.json()["error"]["code"] == "validation_error"
    bad = c.post("/api/v1/auth/register", json={"email": "not-an-email", "password": PW})
    assert bad.status_code == 422
    assert PW not in bad.text  # submitted values are never echoed back


def test_login_errors_are_generic(client):
    make_user(client)
    c = TestClient(app)
    wrong_pw = c.post("/api/v1/auth/login", json={"email": "a@example.com", "password": "wrong-password-1"})
    no_user = c.post("/api/v1/auth/login", json={"email": "zzz@example.com", "password": "wrong-password-1"})
    assert wrong_pw.status_code == no_user.status_code == 401
    assert wrong_pw.json() == no_user.json()


def test_login_rate_limit(client):
    make_user(client)
    c = TestClient(app)
    codes = [c.post("/api/v1/auth/login", json={"email": "a@example.com", "password": "bad-password-xx"}).status_code
             for _ in range(6)]
    assert codes[:5] == [401] * 5 and codes[5] == 429
    # even the right password is blocked while locked out
    assert c.post("/api/v1/auth/login", json={"email": "a@example.com", "password": PW}).status_code == 429


def test_password_change(client):
    c = make_user(client)
    bad = c.patch("/api/v1/users/me/password", json={"current_password": "nope-nope-nope", "new_password": "brand-new-pass-1"})
    assert bad.status_code == 400
    ok = c.patch("/api/v1/users/me/password", json={"current_password": PW, "new_password": "brand-new-pass-1"})
    assert ok.status_code == 204
    fresh = TestClient(app)
    assert fresh.post("/api/v1/auth/login", json={"email": "a@example.com", "password": PW}).status_code == 401
    assert fresh.post("/api/v1/auth/login", json={"email": "a@example.com", "password": "brand-new-pass-1"}).status_code == 200


def test_long_password_not_truncated(client):
    long_pw = "x" * 100 + "A"
    c = make_user(client, "long@example.com", long_pw)
    fresh = TestClient(app)
    same_prefix = "x" * 100 + "B"
    assert fresh.post("/api/v1/auth/login", json={"email": "long@example.com", "password": same_prefix}).status_code == 401
    assert fresh.post("/api/v1/auth/login", json={"email": "long@example.com", "password": long_pw}).status_code == 200
    assert c.get("/api/v1/users/me").status_code == 200


def test_delete_account_needs_password_and_removes_data(client):
    c = make_user(client)
    assert c.request("DELETE", "/api/v1/users/me", json={"password": "wrong-password-1"}).status_code == 400
    assert c.request("DELETE", "/api/v1/users/me", json={"password": PW}).status_code == 204
    assert TestClient(app).post("/api/v1/auth/login", json={"email": "a@example.com", "password": PW}).status_code == 401


def test_private_routes_require_auth(client):
    for method, path in [("get", "/api/v1/users/me"), ("get", "/api/v1/assessments"),
                         ("get", "/api/v1/assessments/1"), ("delete", "/api/v1/assessments/1"),
                         ("delete", "/api/v1/assessments")]:
        assert getattr(client, method)(path).status_code == 401, path


def test_oversized_body_rejected(client):
    r = client.post("/api/v1/auth/login", content=b"x" * 40_000, headers={"Content-Type": "application/json"})
    assert r.status_code == 413
