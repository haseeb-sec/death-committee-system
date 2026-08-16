from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.services.accounting import AccountingError
from app.services.member import add_member, leave_member
from app.services.member_financial import (
    get_member_financial_summary,
)
from app.services.member_statement import (
    get_member_statement,
)


router = APIRouter(
    prefix="/members",
    tags=["Members"],
)


class MemberCreate(BaseModel):
    committee_id: int
    name: str
    joined_on: date


class MemberLeave(BaseModel):
    leaving_date: date


@router.post("")
def create_member_api(
    data: MemberCreate,
    db: Session = Depends(get_db),
):
    try:
        member = add_member(
            db,
            committee_id=data.committee_id,
            name=data.name,
            joined_on=data.joined_on,
        )

        db.commit()
        db.refresh(member)

        return {
            "id": member.id,
            "committee_id": member.committee_id,
            "name": member.name,
            "joined_on": member.joined_on,
            "is_active": member.is_active,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.post("/{member_id}/leave")
def leave_member_api(
    member_id: int,
    data: MemberLeave,
    db: Session = Depends(get_db),
):
    try:
        member = leave_member(
            db,
            member_id=member_id,
            leaving_date=data.leaving_date,
        )

        db.commit()
        db.refresh(member)

        return {
            "id": member.id,
            "committee_id": member.committee_id,
            "name": member.name,
            "joined_on": member.joined_on,
            "left_on": member.left_on,
            "is_active": member.is_active,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.get("/{member_id}/financial-summary")
def member_financial_summary(
    member_id: int,
    db: Session = Depends(get_db),
):
    try:
        return get_member_financial_summary(
            db,
            member_id=member_id,
        )
    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@router.get("/{member_id}/statement")
def member_statement(
    member_id: int,
    db: Session = Depends(get_db),
):
    try:
        return get_member_statement(
            db,
            member_id=member_id,
        )
    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
