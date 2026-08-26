from sqlalchemy import select
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.committee import (
    CommitteeCreate,
    CommitteeFinancialPositionResponse,
    CommitteeResponse,
    CommitteeSummaryResponse,
)

from app.api.dependencies import get_db
from app.api.auth import get_current_user
from app.api.permissions import require_authenticated, require_super_admin
from app.services.accounting import AccountingError
from app.services.committee import (
    create_committee,
    close_committee,
    list_committees,
)
from app.services.committee_financial import (
    get_committee_financial_position,
)
from app.services.committee_summary import get_committee_summary
from app.services.audit import record_audit
from app.models import (
    Committee,
    User,
    UserCommitteeAccess,
    UserRole,
)
from app.services.access_control import (
    grant_committee_access,
    require_committee_access,
    require_committee_admin_access,
)


router = APIRouter(
    prefix="/committees",
    tags=["Committees"],
)


@router.post("", response_model=CommitteeResponse)
def create_committee_api(
    data: CommitteeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_super_admin),
):
    try:
        committee = create_committee(
            db,
            name=data.name,
        )

        access = UserCommitteeAccess(
            user_id=current_user.id,
            committee_id=committee.id,
            granted_by_user_id=current_user.id,
            is_active=True,
            is_admin=False,
        )
        db.add(access)

        record_audit(
            db,
            user_id=current_user.id,
            action="create",
            entity_type="committee",
            entity_id=committee.id,
            description=f"Created committee '{committee.name}'",
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="grant_access",
            entity_type="committee",
            entity_id=committee.id,
            description=(
                f"Granted user '{current_user.username}' "
                f"access to committee '{committee.name}'"
            ),
        )

        db.commit()
        db.refresh(committee)

        return {
            "id": committee.id,
            "name": committee.name,
            "is_active": committee.is_active,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.post(
    "/{committee_id}/admins/{user_id}",
)
def assign_committee_admin_api(
    committee_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_super_admin),
):
    try:
        require_super_admin(current_user)

        committee = db.get(Committee, committee_id)
        if committee is None or not committee.is_active:
            raise AccountingError(
                f"Committee not found: {committee_id}"
            )

        target_user = db.get(User, user_id)
        if target_user is None or not target_user.is_active:
            raise AccountingError(
                f"User not found or inactive: {user_id}"
            )

        access = grant_committee_access(
            db,
            user=target_user,
            committee_id=committee_id,
            granted_by_user=current_user,
            is_admin=True,
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="grant_committee_admin",
            entity_type="committee",
            entity_id=committee_id,
            description=(
                f"Assigned user '{target_user.username}' "
                f"as administrator of committee {committee_id}"
            ),
        )

        db.commit()
        db.refresh(access)

        return {
            "id": access.id,
            "user_id": access.user_id,
            "committee_id": access.committee_id,
            "is_active": access.is_active,
            "is_admin": access.is_admin,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{committee_id}/admins/{user_id}",
)
def revoke_committee_admin_api(
    committee_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_super_admin),
):
    try:
        require_super_admin(current_user)

        access = (
            db.query(UserCommitteeAccess)
            .filter(
                UserCommitteeAccess.user_id == user_id,
                UserCommitteeAccess.committee_id == committee_id,
                UserCommitteeAccess.is_active.is_(True),
            )
            .first()
        )

        if access is None:
            raise AccountingError(
                f"Active committee access not found for user {user_id}"
            )

        access.is_admin = False

        record_audit(
            db,
            user_id=current_user.id,
            action="revoke_committee_admin",
            entity_type="committee",
            entity_id=committee_id,
            description=(
                f"Removed committee administrator privileges from "
                f"user {user_id} in committee {committee_id}"
            ),
        )

        db.commit()

        return {
            "user_id": user_id,
            "committee_id": committee_id,
            "is_active": access.is_active,
            "is_admin": False,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc



@router.get(
    "/{committee_id}/administrators",
)
def list_committee_administrators_api(
    committee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return active Committee Admin assignments for one committee.

    Super Admin may inspect any active committee.
    Committee Admin may inspect the committee they administer.
    """
    committee = db.get(Committee, committee_id)

    if committee is None:
        raise HTTPException(status_code=404, detail="Committee not found")

    # Super Admin has global committee visibility.
    if current_user.role != UserRole.SUPER_ADMIN.value:
        require_committee_admin_access(
            db,
            user=current_user,
            committee_id=committee_id,
        )

    rows = db.execute(
        select(UserCommitteeAccess, User)
        .join(User, User.id == UserCommitteeAccess.user_id)
        .where(
            UserCommitteeAccess.committee_id == committee_id,
            UserCommitteeAccess.is_active.is_(True),
            UserCommitteeAccess.is_admin.is_(True),
        )
        .order_by(User.username.asc())
    ).all()

    return [
        {
            "user_id": access.user_id,
            "username": user.username,
            "role": user.role,
            "is_active": access.is_active,
            "is_admin": access.is_admin,
        }
        for access, user in rows
    ]

@router.get(
    "",
    response_model=list[CommitteeResponse],
)
def list_committees_api(
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    return list_committees(
        db,
        user=current_user,
    )


@router.post(
    "/{committee_id}/close",
    response_model=CommitteeResponse,
)
def close_committee_api(
    committee_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        require_committee_admin_access(
            db,
            user=current_user,
            committee_id=committee_id,
        )

        committee = close_committee(
            db,
            committee_id=committee_id,
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="close",
            entity_type="committee",
            entity_id=committee.id,
            description=f"Closed committee {committee.name}",
        )

        db.commit()
        db.refresh(committee)

        return {
            "id": committee.id,
            "name": committee.name,
            "is_active": committee.is_active,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.get(
    "/{committee_id}/summary",
    response_model=CommitteeSummaryResponse,
)
def committee_summary(
    committee_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        require_committee_access(
            db,
            user=current_user,
            committee_id=committee_id,
        )

        return get_committee_summary(
            db,
            committee_id=committee_id,
        )
    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@router.get(
    "/{committee_id}/financial-position",
    response_model=CommitteeFinancialPositionResponse,
)
def committee_financial_position(
    committee_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        require_committee_access(
            db,
            user=current_user,
            committee_id=committee_id,
        )

        return get_committee_financial_position(
            db,
            committee_id=committee_id,
        )
    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
