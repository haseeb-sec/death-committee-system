from datetime import datetime, timedelta, timezone
import time

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.schemas.users import (
    UserCreate,
    UserResponse,
    CommitteeAccessCreate,
    CommitteeAccessResponse,
    PasswordChange,
    PasswordReset,
)

from app.api.auth import get_db
from app.api.permissions import require_super_admin, require_authenticated
from app.models import User, UserCommitteeAccess
from app.services.auth import (
    create_password_reset_token,
    hash_password,
    hash_password_reset_token,
    verify_password,
)
from app.services.audit import record_audit
from app.services.access_control import grant_committee_access

router = APIRouter(prefix="/users", tags=["Users"])

# Lightweight abuse protection for the public password-reset endpoint.
# This intentionally lives in memory so it does not add database/accounting state.
password_reset_attempts: dict[str, list[float]] = {}
PASSWORD_RESET_RATE_WINDOW = 60.0
PASSWORD_RESET_RATE_LIMIT = 5


def check_password_reset_rate_limit(client_key: str) -> None:
    now = time.monotonic()
    attempts = password_reset_attempts.get(client_key, [])

    attempts = [
        timestamp
        for timestamp in attempts
        if now - timestamp < PASSWORD_RESET_RATE_WINDOW
    ]

    if len(attempts) >= PASSWORD_RESET_RATE_LIMIT:
        password_reset_attempts[client_key] = attempts
        raise HTTPException(
            status_code=429,
            detail="Too many password reset attempts. Please try again later.",
        )

    attempts.append(now)
    password_reset_attempts[client_key] = attempts


@router.post("", response_model=UserResponse)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    if data.role.value == UserRole.SUPER_ADMIN.value and current_user.role != UserRole.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="Super Admin access required")

    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    user = User(
        username=data.username,
        password_hash=hash_password(data.password),
        role=data.role.value,
        is_active=True,
    )

    db.add(user)
    db.flush()

    record_audit(
        db,
        user_id=current_user.id,
        action="create",
        entity_type="user",
        entity_id=user.id,
        description=f"Created user '{user.username}' with role '{user.role}'",
    )

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
    }


@router.post("/me/password")
def change_my_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect",
        )

    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password",
        )

    current_user.password_hash = hash_password(data.new_password)

    record_audit(
        db,
        user_id=current_user.id,
        action="change_password",
        entity_type="user",
        entity_id=current_user.id,
        description=f"User '{current_user.username}' changed their password",
    )

    db.commit()

    return {"message": "Password changed successfully"}


@router.post("/password-reset")
def reset_password(
    data: PasswordReset,
    request: Request,
    db: Session = Depends(get_db),
):
    client_host = request.client.host if request.client else "unknown"
    check_password_reset_rate_limit(client_host)

    token_hash = hash_password_reset_token(data.token)

    user = (
        db.query(User)
        .filter(User.password_reset_token_hash == token_hash)
        .first()
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset token",
        )

    expires_at = user.password_reset_expires_at

    if (
        expires_at is None
        or expires_at.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc)
    ):
        user.password_reset_token_hash = None
        user.password_reset_expires_at = None
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset token",
        )

    user.password_hash = hash_password(data.new_password)
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None

    record_audit(
        db,
        user_id=user.id,
        action="reset_password",
        entity_type="user",
        entity_id=user.id,
        description=f"Password reset completed for user '{user.username}'",
    )

    db.commit()

    return {"message": "Password reset successfully"}


@router.post("/{user_id}/password-reset")
def issue_password_reset(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    user = db.get(User, user_id)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=404,
            detail="User not found or inactive",
        )

    token = create_password_reset_token()

    user.password_reset_token_hash = hash_password_reset_token(token)
    user.password_reset_expires_at = (
        datetime.now(timezone.utc) + timedelta(minutes=15)
    )

    record_audit(
        db,
        user_id=current_user.id,
        action="issue_password_reset",
        entity_type="user",
        entity_id=user.id,
        description=(
            f"Password recovery token issued for user '{user.username}'"
        ),
    )

    db.commit()

    return {
        "message": "Password recovery token issued",
        "token": token,
        "expires_in_minutes": 15,
    }


@router.get("", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    users = db.query(User).order_by(User.id).all()

    return [
        {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
        }
        for user in users
    ]


@router.patch(
    "/{user_id}/deactivate",
    response_model=UserResponse,
)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="User is already inactive",
        )

    user.is_active = False

    record_audit(
        db,
        user_id=current_user.id,
        action="deactivate",
        entity_type="user",
        entity_id=user.id,
        description=f"Deactivated user '{user.username}'",
    )

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
    }


@router.patch(
    "/{user_id}/activate",
    response_model=UserResponse,
)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Your account is already active",
        )

    if user.is_active:
        raise HTTPException(
            status_code=400,
            detail="User is already active",
        )

    user.is_active = True

    record_audit(
        db,
        user_id=current_user.id,
        action="activate",
        entity_type="user",
        entity_id=user.id,
        description=f"Activated user '{user.username}'",
    )

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
    }


@router.post(
    "/{user_id}/committees/{committee_id}/access",
    response_model=CommitteeAccessResponse,
)
def grant_user_committee_access(
    user_id: int,
    committee_id: int,
    data: CommitteeAccessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    if data.user_id != user_id:
        raise HTTPException(
            status_code=400,
            detail="User ID in path and request body must match",
        )

    target_user = db.get(User, user_id)
    if target_user is None or not target_user.is_active:
        raise HTTPException(
            status_code=404,
            detail="User not found or inactive",
        )

    try:
        access = grant_committee_access(
            db,
            user=target_user,
            committee_id=committee_id,
            granted_by_user=current_user,
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="grant_access",
            entity_type="committee",
            entity_id=committee_id,
            description=(
                f"Granted user '{target_user.username}' access "
                f"to committee {committee_id}"
            ),
        )

        db.commit()
        db.refresh(access)
        return access

    except Exception:
        db.rollback()
        raise


@router.get("/me/committees/access")
def get_my_committee_access(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    accesses = (
        db.query(UserCommitteeAccess)
        .filter(
            UserCommitteeAccess.user_id == current_user.id,
            UserCommitteeAccess.is_active.is_(True),
        )
        .all()
    )

    return [
        {
            "id": access.id,
            "user_id": access.user_id,
            "committee_id": access.committee_id,
            "is_active": access.is_active,
            "is_admin": access.is_admin,
        }
        for access in accesses
    ]


@router.get(
    "/{user_id}/committees/{committee_id}/access",
    response_model=CommitteeAccessResponse,
)
def get_user_committee_access(
    user_id: int,
    committee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    access = (
        db.query(UserCommitteeAccess)
        .filter(
            UserCommitteeAccess.user_id == user_id,
            UserCommitteeAccess.committee_id == committee_id,
        )
        .first()
    )

    if access is None:
        raise HTTPException(
            status_code=404,
            detail="Committee access not found",
        )

    return access


@router.patch(
    "/{user_id}/committees/{committee_id}/access/deactivate",
    response_model=CommitteeAccessResponse,
)
def deactivate_user_committee_access(
    user_id: int,
    committee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    access = (
        db.query(UserCommitteeAccess)
        .filter(
            UserCommitteeAccess.user_id == user_id,
            UserCommitteeAccess.committee_id == committee_id,
        )
        .first()
    )

    if access is None:
        raise HTTPException(
            status_code=404,
            detail="Committee access not found",
        )

    if not access.is_active:
        raise HTTPException(
            status_code=400,
            detail="Committee access is already inactive",
        )

    access.is_active = False

    record_audit(
        db,
        user_id=current_user.id,
        action="revoke_access",
        entity_type="committee",
        entity_id=committee_id,
        description=(
            f"Revoked user '{user_id}' access "
            f"to committee {committee_id}"
        ),
    )

    db.commit()
    db.refresh(access)

    return access
