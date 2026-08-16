from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.services.accounting import AccountingError
from app.services.committee import create_committee
from app.services.committee_financial import (
    get_committee_financial_position,
)
from app.services.committee_summary import get_committee_summary


router = APIRouter(
    prefix="/committees",
    tags=["Committees"],
)


class CommitteeCreate(BaseModel):
    name: str


@router.post("")
def create_committee_api(
    data: CommitteeCreate,
    db: Session = Depends(get_db),
):
    try:
        committee = create_committee(
            db,
            name=data.name,
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


@router.get("/{committee_id}/summary")
def committee_summary(
    committee_id: int,
    db: Session = Depends(get_db),
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


@router.get("/{committee_id}/financial-position")
def committee_financial_position(
    committee_id: int,
    db: Session = Depends(get_db),
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
