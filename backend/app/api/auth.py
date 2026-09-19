import time

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models import User
from app.services.auth import create_access_token, verify_password, decode_access_token
from app.services.audit import record_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Lightweight abuse protection for the public login endpoint.
# This intentionally lives in memory so it does not add database/accounting state.
login_attempts: dict[str, list[float]] = {}
LOGIN_RATE_WINDOW = 60.0
LOGIN_RATE_LIMIT = 5


def check_login_rate_limit(client_key: str) -> None:
    now = time.monotonic()
    attempts = login_attempts.get(client_key, [])

    attempts = [
        timestamp
        for timestamp in attempts
        if now - timestamp < LOGIN_RATE_WINDOW
    ]

    login_attempts[client_key] = attempts

    if len(attempts) >= LOGIN_RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Please try again later.",
        )


def record_failed_login_attempt(client_key: str) -> None:
    now = time.monotonic()
    attempts = login_attempts.get(client_key, [])

    attempts = [
        timestamp
        for timestamp in attempts
        if now - timestamp < LOGIN_RATE_WINDOW
    ]

    attempts.append(now)
    login_attempts[client_key] = attempts

@router.post("/login")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    client_host = request.client.host if request.client else "unknown"
    check_login_rate_limit(client_host)

    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not user.is_active:
        record_failed_login_attempt(client_host)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(form_data.password, user.password_hash):
        record_failed_login_attempt(client_host)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id, user.role, user.token_version)

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
        token_version = int(payload["ver"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.get(User, user_id)

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    if token_version != user.token_version:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user


@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.token_version += 1
    db.commit()

    return {"message": "Logged out successfully"}
