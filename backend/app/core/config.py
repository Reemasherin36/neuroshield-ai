from pathlib import Path

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


settings = Settings()
