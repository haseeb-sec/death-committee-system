from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.services.accounting import AccountingError
from app.services.member_due import (
    add_member_due,
    get_member_dues,
    get_outstanding_dues,
    pay_member_due,
)


router = APIRouter(
    prefix="/members",
    tags=["Member Dues"],
)


class MemberDueCreate(BaseModel):
    amount: int = Field(gt=0)
    due_date: date
    description: str
    reference: str | None = None


class MemberDuePayment(BaseModel):
    amount: int = Field(gt=0)


@router.post("/{member_id}/dues")
def create_member_due(
    member_id: int,
    data: MemberDueCreate,
    db: Session = Depends(get_db),
):
    try:
        due = add_member_due(
            db,
            member_id=member_id,
            amount=data.amount,
            due_date=data.due_date,
            description=data.description,
            reference=data.reference,
        )

        db.commit()
        db.refresh(due)

        return {
            "id": due.id,
            "committee_id": due.committee_id,
            "member_id": due.member_id,
            "amount": due.amount,
            "paid_amount": due.paid_amount,
            "outstanding_amount": (
                due.amount - due.paid_amount
            ),
            "due_date": due.due_date,
            "description": due.description,
            "reference": due.reference,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.get("/{member_id}/dues")
def list_member_dues(
    member_id: int,
    db: Session = Depends(get_db),
):
    try:
        dues = get_member_dues(
            db,
            member_id=member_id,
        )

        return [
            {
                "id": due.id,
                "committee_id": due.committee_id,
                "member_id": due.member_id,
                "amount": due.amount,
                "paid_amount": due.paid_amount,
                "outstanding_amount": (
                    due.amount - due.paid_amount
                ),
                "due_date": due.due_date,
                "description": due.description,
                "reference": due.reference,
            }
            for due in dues
        ]

    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@router.get("/{member_id}/dues/outstanding")
def member_outstanding_dues(
    member_id: int,
    db: Session = Depends(get_db),
):
    try:
        outstanding = get_outstanding_dues(
            db,
            member_id=member_id,
        )

        return {
            "member_id": member_id,
            "outstanding_dues": outstanding,
        }

    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@router.post("/dues/{due_id}/pay")
def pay_member_due_api(
    due_id: int,
    data: MemberDuePayment,
    db: Session = Depends(get_db),
):
    try:
        due = pay_member_due(
            db,
            due_id=due_id,
            amount=data.amount,
        )

        db.commit()
        db.refresh(due)

        return {
            "id": due.id,
            "committee_id": due.committee_id,
            "member_id": due.member_id,
            "amount": due.amount,
            "paid_amount": due.paid_amount,
            "outstanding_amount": (
                due.amount - due.paid_amount
            ),
            "due_date": due.due_date,
            "description": due.description,
            "reference": due.reference,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
