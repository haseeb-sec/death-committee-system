from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Member, MemberDue
from app.services.accounting import AccountingError


def add_member_due(
    db: Session,
    *,
    member_id: int,
    amount: int,
    due_date: date,
    description: str,
    reference: str | None = None,
) -> MemberDue:
    description = description.strip()

    if amount <= 0:
        raise AccountingError(
            "Due amount must be greater than zero."
        )

    if not description:
        raise AccountingError(
            "Due description cannot be empty."
        )

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    if not member.committee.is_active:
        raise AccountingError(
            f"Committee is not active: {member.committee_id}"
        )

    due = MemberDue(
        committee_id=member.committee_id,
        member_id=member.id,
        amount=amount,
        paid_amount=0,
        due_date=due_date,
        description=description,
        reference=reference,
    )

    db.add(due)
    db.flush()

    return due


def pay_member_due(
    db: Session,
    *,
    due_id: int,
    amount: int,
) -> MemberDue:
    """
    Record payment against a member due.

    The original due amount is preserved.
    Only paid_amount is increased.
    """

    if amount <= 0:
        raise AccountingError(
            "Payment amount must be greater than zero."
        )

    due = db.get(MemberDue, due_id)

    if due is None:
        raise AccountingError(
            f"Member due not found: {due_id}"
        )

    remaining = due.amount - due.paid_amount

    if amount > remaining:
        raise AccountingError(
            f"Payment exceeds outstanding due. "
            f"Remaining amount: {remaining}"
        )

    due.paid_amount += amount

    db.flush()

    return due


def get_member_dues(
    db: Session,
    *,
    member_id: int,
) -> list[MemberDue]:
    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    return db.scalars(
        select(MemberDue)
        .where(
            MemberDue.member_id == member_id,
        )
        .order_by(
            MemberDue.due_date.asc(),
            MemberDue.id.asc(),
        )
    ).all()


def get_outstanding_dues(
    db: Session,
    *,
    member_id: int,
) -> int:
    dues = get_member_dues(
        db,
        member_id=member_id,
    )

    return sum(
        due.amount - due.paid_amount
        for due in dues
    )
