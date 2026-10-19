import time
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.core.config import settings

_hasher = PasswordHasher()
# Verified against when the email is unknown, so login timing does not reveal which emails exist.
_DUMMY_HASH = _hasher.hash("not-a-real-password")
COOKIE_NAME = "access_token"


def hash_password(password: str) -> str:
    return _hasher.hash(password)  # argon2 hashes the full password; nothing is truncated


def verify_password(password: str, password_hash: str | None) -> bool:
    try:
        return _hasher.verify(password_hash or _DUMMY_HASH, password) and password_hash is not None
    except (VerificationError, InvalidHashError):
        return False


def create_token(user_id: int) -> str:
    now = datetime.now(UTC)
    payload = {"sub": str(user_id), "iat": now, "exp": now + timedelta(minutes=settings.jwt_expire_minutes)}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> int | None:
    try:
        return int(jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


class LoginLimiter:
    """In-memory failed-login limiter (per process; use Redis or similar when deployed)."""

    def __init__(self, max_failures: int = 5, window_s: int = 900):
        self.max, self.window, self.fails = max_failures, window_s, {}

    def _recent(self, key):
        now = time.monotonic()
        self.fails[key] = [t for t in self.fails.get(key, []) if now - t < self.window]
        return self.fails[key]

    def blocked(self, key) -> bool:
        return len(self._recent(key)) >= self.max

    def record_failure(self, key) -> None:
        self._recent(key).append(time.monotonic())

    def reset(self, key=None) -> None:
        self.fails.pop(key, None) if key else self.fails.clear()


login_limiter = LoginLimiter()
