from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models import MemberDue
from app.schemas.member_due import (
    MemberDueCreate,
    MemberDuePayment,
    MemberDueResponse,
    MemberOutstandingDuesResponse,
)

from app.api.dependencies import get_db
from app.api.permissions import require_authenticated
from app.services.accounting import AccountingError
from app.services.member_due import (
    add_member_due,
    get_member_dues,
    get_outstanding_dues,
    pay_member_due,
)
from app.services.audit import record_audit
from app.services.access_control import require_member_access, require_committee_admin_access


router = APIRouter(
    prefix="/members",
    tags=["Member Dues"],
)


@router.post(
    "/{member_id}/dues",
    response_model=MemberDueResponse,
)
def create_member_due(
    member_id: int,
    data: MemberDueCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        require_member_access(
            db,
            user=current_user,
            member_id=member_id,
        )

        due = add_member_due(
            db,
            member_id=member_id,
            amount=data.amount,
            due_date=data.due_date,
            description=data.description,
            reference=data.reference,
        )

        record_audit(
            db,
            user_id=current_user.id,
            committee_id=due.committee_id,
            action="create",
            entity_type="member_due",
            entity_id=due.id,
            description=(
                f"Created due of {due.amount} for member {member_id}: "
                f"{due.description}"
            ),
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


@router.get(
    "/{member_id}/dues",
    response_model=list[MemberDueResponse],
)
def list_member_dues(
    member_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        require_member_access(
            db,
            user=current_user,
            member_id=member_id,
        )

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


@router.get(
    "/{member_id}/dues/outstanding",
    response_model=MemberOutstandingDuesResponse,
)
def member_outstanding_dues(
    member_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        require_member_access(
            db,
            user=current_user,
            member_id=member_id,
        )

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


@router.post(
    "/dues/{due_id}/pay",
    response_model=MemberDueResponse,
)
def pay_member_due_api(
    due_id: int,
    data: MemberDuePayment,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        due = db.get(MemberDue, due_id)
        if due is None:
            raise AccountingError(
                f"Member due not found: {due_id}"
            )

        try:
            require_committee_admin_access(
                db,
                user=current_user,
                committee_id=due.committee_id,
            )
        except AccountingError as exc:
            db.rollback()
            raise HTTPException(
                status_code=404,
                detail=str(exc),
            ) from exc

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
