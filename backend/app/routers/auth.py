from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import ApiError
from app.core.security import (
    COOKIE_NAME,
    create_token,
    hash_password,
    login_limiter,
    verify_password,
)
from app.db.session import get_db
from app.models import User
from app.schemas.auth import Credentials, RegisterIn, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_cookie(response: Response, user_id: int) -> None:
    response.set_cookie(
        COOKIE_NAME, create_token(user_id), httponly=True, samesite="lax",
        secure=settings.app_env == "production", max_age=settings.jwt_expire_minutes * 60, path="/")


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: RegisterIn, response: Response, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == body.email)):
        raise ApiError(409, "email_taken", "An account with this email already exists.")
    user = User(email=body.email, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    _set_cookie(response, user.id)
    return user


@router.post("/login", response_model=UserOut)
def login(body: Credentials, request: Request, response: Response, db: Session = Depends(get_db)):
    key = f"{request.client.host if request.client else 'unknown'}|{body.email}"
    if login_limiter.blocked(key):
        raise ApiError(429, "too_many_attempts", "Too many failed attempts. Try again in a few minutes.")
    user = db.scalar(select(User).where(User.email == body.email))
    ok = verify_password(body.password, user.password_hash if user else None)
    if not ok:
        login_limiter.record_failure(key)
        raise ApiError(401, "invalid_credentials", "Incorrect email or password.")
    login_limiter.reset(key)
    _set_cookie(response, user.id)
    return user


@router.post("/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    response.status_code = 204
    return response
