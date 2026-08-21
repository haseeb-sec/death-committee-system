from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.users import UserCreate, UserResponse, CommitteeAccessCreate, CommitteeAccessResponse

from app.api.auth import get_db
from app.api.permissions import require_super_admin
from app.models import User, UserCommitteeAccess
from app.services.auth import hash_password
from app.services.audit import record_audit
from app.services.access_control import grant_committee_access

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("", response_model=UserResponse)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
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
