from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.api.permissions import require_admin, require_authenticated
from app.schemas.committee import (
    CommitteeCreate,
    CommitteeFinancialPositionResponse,
    CommitteeResponse,
    CommitteeSummaryResponse,
)

from app.api.dependencies import get_db
from app.api.permissions import require_admin, require_authenticated
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
from app.models import UserCommitteeAccess, UserRole
from app.services.access_control import require_committee_access


router = APIRouter(
    prefix="/committees",
    tags=["Committees"],
)


@router.post("", response_model=CommitteeResponse)
def create_committee_api(
    data: CommitteeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
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
    current_user = Depends(require_admin),
):
    try:
        require_committee_access(
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
