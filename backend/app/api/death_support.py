from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.services.accounting import AccountingError
from app.services.death_support import record_death_support


router = APIRouter(
    prefix="/members",
    tags=["Death Support"],
)


class DeathSupportCreate(BaseModel):
    beneficiary_name: str
    amount: int = Field(gt=0)
    support_date: date
    reference: str | None = None


@router.post("/{member_id}/death-support")
def create_death_support(
    member_id: int,
    data: DeathSupportCreate,
    db: Session = Depends(get_db),
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

        db.commit()
        db.refresh(support)

        return {
            "id": support.id,
            "committee_id": support.committee_id,
            "member_id": support.member_id,
            "beneficiary_name": support.beneficiary_name,
            "amount": support.amount,
            "support_date": support.support_date,
            "reference": support.reference,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
