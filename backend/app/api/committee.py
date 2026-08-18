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
from app.services.committee import create_committee
from app.services.committee_financial import (
    get_committee_financial_position,
)
from app.services.committee_summary import get_committee_summary
from app.services.audit import record_audit


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

        record_audit(
            db,
            user_id=current_user.id,
            action="create",
            entity_type="committee",
            entity_id=committee.id,
            description=f"Created committee '{committee.name}'",
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
        return get_committee_financial_position(
            db,
            committee_id=committee_id,
        )
    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
