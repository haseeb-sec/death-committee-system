from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.death_support import (
    DeathSupportCreate,
    DeathSupportResponse,
    DeathSupportStatusResponse,
)

from app.api.dependencies import get_db
from app.api.permissions import require_admin, require_authenticated
from app.services.accounting import AccountingError
from app.services.death_support import (
    get_member_death_support,
    record_death_support,
)
from app.services.audit import record_audit


router = APIRouter(
    prefix="/members",
    tags=["Death Support"],
)


def serialize_death_support(support):
    return {
        "id": support.id,
        "committee_id": support.committee_id,
        "member_id": support.member_id,
        "beneficiary_name": support.beneficiary_name,
        "amount": support.amount,
        "member_funded_amount": support.member_funded_amount,
        "qarz_e_hasana_amount": support.qarz_e_hasana_amount,
        "support_date": support.support_date,
        "reference": support.reference,
    }


@router.post(
    "/{member_id}/death-support",
    response_model=DeathSupportResponse,
)
def create_death_support(
    member_id: int,
    data: DeathSupportCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    try:
        support = record_death_support(
            db,
            member_id=member_id,
            beneficiary_name=data.beneficiary_name,
            amount=data.amount,
            support_date=data.support_date,
            reference=data.reference,
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="create",
            entity_type="death_support",
            entity_id=support.id,
            description=(
                f"Recorded death support of {support.amount} "
                f"for member {member_id}, beneficiary '{support.beneficiary_name}'"
            ),
        )

        db.commit()
        db.refresh(support)

        return serialize_death_support(support)

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.get(
    "/{member_id}/death-support",
    response_model=DeathSupportResponse,
)
def get_death_support(
    member_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        support = get_member_death_support(
            db,
            member_id=member_id,
        )

        return serialize_death_support(support)

    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@router.get(
    "/{member_id}/death-support/status",
    response_model=DeathSupportStatusResponse,
)
def get_death_support_status(
    member_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        support = get_member_death_support(
            db,
            member_id=member_id,
        )

        return {
            "member_id": member_id,
            "death_support_recorded": True,
            "support_id": support.id,
            "amount": support.amount,
            "support_date": support.support_date,
        }

    except AccountingError as exc:
        if str(exc).startswith("Member not found:"):
            raise HTTPException(
                status_code=404,
                detail=str(exc),
            ) from exc

        return {
            "member_id": member_id,
            "death_support_recorded": False,
            "support_id": None,
            "amount": 0,
            "support_date": None,
        }
