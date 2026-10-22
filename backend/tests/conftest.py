import os
import tempfile

# Must be set before the app is imported so tests never touch a real database.
_tmp = tempfile.mkdtemp()
# Set TEST_DATABASE_URL (a postgresql:// URL) to run the whole suite against PostgreSQL instead of SQLite.
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL") or f"sqlite:///{_tmp}/test.db"
os.environ["APP_ENV"] = "development"

import pytest
from app.core.security import login_limiter
from app.db.session import Base, engine
from app.main import app
from app.services.model_service import model_service
from fastapi.testclient import TestClient

VALID = {"age": 67, "gender": "Male", "hypertension": 0, "heart_disease": 1, "ever_married": "Yes",
         "work_type": "Private", "Residence_type": "Urban", "avg_glucose_level": 228.7, "bmi": 36.6,
         "smoking_status": "formerly smoked"}
PW = "correct-horse-battery"


@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    login_limiter.reset()
    with TestClient(app) as c:
        yield c


def make_user(app_client, email="a@example.com", password=PW):
    c = TestClient(app)  # separate cookie jar per user
    r = c.post("/api/v1/auth/register", json={"email": email, "password": password})
    assert r.status_code == 201, r.text
    return c


@pytest.fixture()
def model_ready():
    if not model_service.loaded:
        pytest.skip("model artifacts not present; run scripts/train.ps1")
