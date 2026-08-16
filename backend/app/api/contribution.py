from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models import ContributionRate
from app.services.accounting import AccountingError
from app.services.contribution import record_contribution


router = APIRouter(
    tags=["Contributions"],
)


class ContributionRateCreate(BaseModel):
    amount: int = Field(gt=0)
    effective_from: date


class ContributionCreate(BaseModel):
    contribution_date: date
    reference: str | None = None


@router.post("/committees/{committee_id}/contribution-rates")
def create_contribution_rate(
    committee_id: int,
    data: ContributionRateCreate,
    db: Session = Depends(get_db),
):
    try:
        rate = ContributionRate(
            committee_id=committee_id,
            amount=data.amount,
            effective_from=data.effective_from,
        )

        db.add(rate)
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


@router.post("/members/{member_id}/contributions")
def create_contribution(
    member_id: int,
    data: ContributionCreate,
    db: Session = Depends(get_db),
):
    try:
        entry = record_contribution(
            db,
            member_id=member_id,
            contribution_date=data.contribution_date,
            reference=data.reference,
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
