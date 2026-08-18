from fastapi import Depends, HTTPException, status

from app.api.auth import get_current_user
from app.models import User, UserRole


def require_authenticated(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role not in (
        UserRole.ADMIN.value,
        UserRole.SUPER_ADMIN.value,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user


def require_super_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != UserRole.SUPER_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required",
        )

    return current_user
