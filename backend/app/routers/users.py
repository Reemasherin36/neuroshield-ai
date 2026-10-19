from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.deps import current_user
from app.core.errors import ApiError
from app.core.security import COOKIE_NAME, hash_password, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas.auth import PasswordChangeIn, PasswordConfirmIn, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@router.patch("/me/password", status_code=204)
def change_password(body: PasswordChangeIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not verify_password(body.current_password, user.password_hash):
        raise ApiError(400, "wrong_password", "Current password is incorrect.")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return Response(status_code=204)


@router.delete("/me", status_code=204)
def delete_account(body: PasswordConfirmIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not verify_password(body.password, user.password_hash):
        raise ApiError(400, "wrong_password", "Password is incorrect.")
    db.delete(user)  # assessments are removed by the cascade
    db.commit()
    resp = Response(status_code=204)
    resp.delete_cookie(COOKIE_NAME, path="/")
    return resp
