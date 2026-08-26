from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models import User
from app.services.auth import create_access_token, verify_password, decode_access_token
from app.services.audit import record_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id, user.role)

    record_audit(
        db,
        user_id=user.id,
        action="login",
        entity_type="user",
        entity_id=user.id,
        description=f"User '{user.username}' logged in",
    )
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "username": user.username,
    }


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.get(User, user_id)

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return user
