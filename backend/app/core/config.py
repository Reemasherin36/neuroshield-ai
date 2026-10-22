from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore")
    app_env: str = "development"
    database_url: str = "sqlite:///./neuroshield.db"
    jwt_secret: str = "CHANGE_ME_TO_A_LONG_RANDOM_STRING"
    jwt_expire_minutes: int = 30
    frontend_origin: str = "http://localhost:5173"
    artifacts_dir: str = "artifacts"
    # When set, the API also serves the built frontend from this folder (single-origin deployment).
    frontend_dist: str = ""

    @field_validator("database_url")
    @classmethod
    def _postgres_driver(cls, v: str) -> str:
        """Hosts hand out postgres:// or postgresql:// URLs. Select the psycopg 3 driver explicitly."""
        for prefix in ("postgres://", "postgresql://"):
            if v.startswith(prefix):
                return "postgresql+psycopg://" + v[len(prefix):]
        return v


settings = Settings()
