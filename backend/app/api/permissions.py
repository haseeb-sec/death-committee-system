from fastapi import Depends, HTTPException, status

from app.api.auth import get_current_user
from app.models import User, UserRole


def require_authenticated(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Require a valid, active authenticated user.
    """

    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return current_user


def require_super_admin(
    current_user: User = Depends(require_authenticated),
) -> User:
    """
    Require the global Super Admin role.
    """

    if current_user.role != UserRole.SUPER_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required",
        )

    return current_user


def require_admin(
    current_user: User = Depends(require_authenticated),
) -> User:
    """
    Administrative identity check.

    This does NOT mean global administration.

    Committee-specific operations MUST separately enforce
    require_committee_admin_access().
    """

    if current_user.role not in (
        UserRole.SUPER_ADMIN.value,
        UserRole.COMMITTEE_ADMIN.value,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative access required",
        )

    return current_user
