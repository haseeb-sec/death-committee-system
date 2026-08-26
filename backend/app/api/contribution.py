
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.contribution import (
    ContributionCreate,
    ContributionRateCreate,
    ContributionRateResponse,
    ContributionResponse,
)

from app.api.dependencies import get_db
from app.api.permissions import require_authenticated
from app.models import ContributionRate, Member
from app.services.accounting import AccountingError
from app.services.contribution import record_contribution
from app.services.audit import record_audit
from app.services.access_control import require_committee_admin_access, require_committee_access, require_member_access


router = APIRouter(
    tags=["Contributions"],
)


@router.post(
    "/committees/{committee_id}/contribution-rates",
    response_model=ContributionRateResponse,
)
def create_contribution_rate(
    committee_id: int,
    data: ContributionRateCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        require_committee_admin_access(
            db,
            user=current_user,
            committee_id=committee_id,
        )

        rate = ContributionRate(
            committee_id=committee_id,
            amount=data.amount,
            effective_from=data.effective_from,
        )

        db.add(rate)
        db.flush()

        record_audit(
            db,
            user_id=current_user.id,
            action="create",
            entity_type="contribution_rate",
            entity_id=rate.id,
            description=(
                f"Created contribution rate {rate.amount} "
                f"for committee {committee_id}, effective {rate.effective_from}"
            ),
        )

        db.commit()
        db.refresh(rate)

        return {
            "id": rate.id,
            "committee_id": rate.committee_id,
            "amount": rate.amount,
            "effective_from": rate.effective_from,
        }

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.post(
    "/members/{member_id}/contributions",
    response_model=ContributionResponse,
)
def create_contribution(
    member_id: int,
    data: ContributionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        member = db.get(Member, member_id)

        if member is None:
            raise AccountingError(
                f"Member not found: {member_id}"
            )

        require_committee_admin_access(
            db,
            user=current_user,
            committee_id=member.committee_id,
        )
    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    try:
        entry = record_contribution(
            db,
            member_id=member_id,
            contribution_date=data.contribution_date,
            reference=data.reference,
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="create",
            entity_type="contribution",
            entity_id=entry.id,
            description=(
                f"Recorded contribution for member {member_id} "
                f"on {data.contribution_date}"
            ),
        )

        db.commit()
        db.refresh(entry)

        return {
            "journal_entry_id": entry.id,
            "member_id": member_id,
            "contribution_date": data.contribution_date,
            "reference": entry.reference,
            "description": entry.description,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
