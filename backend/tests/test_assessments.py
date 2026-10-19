from tests.conftest import VALID, make_user


def test_consent_required_to_save(client, model_ready):
    c = make_user(client)
    r = c.post("/api/v1/assessments", json={"inputs": VALID, "consent": False})
    assert r.status_code == 400 and r.json()["error"]["code"] == "consent_required"
    assert c.get("/api/v1/assessments").json()["total"] == 0
    assert c.post("/api/v1/assessments", json={"inputs": VALID}).status_code == 422


def test_save_list_get_delete(client, model_ready):
    c = make_user(client)
    created = c.post("/api/v1/assessments", json={"inputs": VALID, "consent": True})
    assert created.status_code == 201
    aid = created.json()["id"]
    page = c.get("/api/v1/assessments").json()
    assert page["total"] == 1 and page["items"][0]["id"] == aid
    row = c.get(f"/api/v1/assessments/{aid}").json()
    assert row["inputs"]["age"] == 67 and row["consent_at"] and row["model_version"]
    assert row["category"] == created.json()["category"]
    assert c.delete(f"/api/v1/assessments/{aid}").status_code == 204
    assert c.get(f"/api/v1/assessments/{aid}").status_code == 404


def test_pagination_and_delete_all(client, model_ready):
    c = make_user(client)
    for _ in range(3):
        c.post("/api/v1/assessments", json={"inputs": VALID, "consent": True})
    p = c.get("/api/v1/assessments?limit=2&offset=0").json()
    assert p["total"] == 3 and len(p["items"]) == 2
    assert len(c.get("/api/v1/assessments?limit=2&offset=2").json()["items"]) == 1
    assert c.get("/api/v1/assessments?limit=0").status_code == 422
    assert c.delete("/api/v1/assessments").status_code == 204
    assert c.get("/api/v1/assessments").json()["total"] == 0


def test_user_a_cannot_read_or_delete_user_b(client, model_ready):
    a = make_user(client, "a@example.com")
    b = make_user(client, "b@example.com")
    aid = a.post("/api/v1/assessments", json={"inputs": VALID, "consent": True}).json()["id"]
    assert b.get(f"/api/v1/assessments/{aid}").status_code == 404
    assert b.delete(f"/api/v1/assessments/{aid}").status_code == 404
    assert b.get("/api/v1/assessments").json()["total"] == 0
    b.delete("/api/v1/assessments")  # "delete all mine" must not touch A's data
    assert a.get(f"/api/v1/assessments/{aid}").status_code == 200


def test_deleting_account_deletes_assessments(client, model_ready):
    from app.db.session import SessionLocal
    from app.models import Assessment
    from sqlalchemy import func, select

    from tests.conftest import PW

    c = make_user(client)
    c.post("/api/v1/assessments", json={"inputs": VALID, "consent": True})
    assert c.request("DELETE", "/api/v1/users/me", json={"password": PW}).status_code == 204
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(Assessment)) == 0
