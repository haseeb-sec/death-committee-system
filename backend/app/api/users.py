from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.users import UserCreate, UserResponse

from app.api.auth import get_db
from app.api.permissions import require_super_admin
from app.models import User
from app.services.auth import hash_password
from app.services.audit import record_audit

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
