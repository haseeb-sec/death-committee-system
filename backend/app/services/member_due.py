from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Account,
    AccountType,
    Member,
    MemberDue,
)
from app.services.accounting import (
    AccountingError,
    create_journal_entry,
)


def add_member_due(
    db: Session,
    *,
    member_id: int,
    amount: int,
    due_date: date,
    description: str,
    reference: str | None = None,
    due_type: str = "ordinary",
) -> MemberDue:
    """
    Record an amount owed by a member.

    Creating a due does not create a journal entry.

    The due becomes an accounting event when the member actually
    pays it. At that point committee cash increases and the
    recovery account records the recovery.
    """

    description = description.strip()

    if amount <= 0:
        raise AccountingError(
            "Due amount must be greater than zero."
        )

    if not description:
        raise AccountingError(
            "Due description cannot be empty."
        )

    allowed_due_types = {"ordinary", "qarz_e_hasana"}

    if due_type not in allowed_due_types:
        raise AccountingError(
            f"Invalid due type: {due_type}"
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
        due_type=due_type,
        reference=reference,
    )

    db.add(due)
    db.flush()

    return due


# Public compatibility name used by the settlement/integrity API.
create_member_due = add_member_due


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

    Accounting for the actual payment:

        Committee Cash      +amount
        Recovery Account    -amount

    This records money entering the committee while preserving
    the business-level due history separately.
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

    if remaining <= 0:
        raise AccountingError(
            f"Member due is already fully paid: {due_id}"
        )

    if amount > remaining:
        raise AccountingError(
            f"Payment exceeds outstanding due. "
            f"Remaining amount: {remaining}"
        )

    member = db.get(Member, due.member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {due.member_id}"
        )

    if not member.committee.is_active:
        raise AccountingError(
            f"Committee is not active: {member.committee_id}"
        )

    cash_account = db.scalars(
        select(Account)
        .where(
            Account.account_type == AccountType.CASH,
            Account.committee_id == due.committee_id,
            Account.member_id.is_(None),
        )
    ).first()

    if cash_account is None:
        raise AccountingError(
            "Committee cash account not found."
        )

    recovery_account = db.scalars(
        select(Account)
        .where(
            Account.account_type == AccountType.RECOVERY,
            Account.committee_id == due.committee_id,
            Account.member_id.is_(None),
        )
    ).first()

    if recovery_account is None:
        raise AccountingError(
            "Committee recovery account not found."
        )

    if due.due_type == "qarz_e_hasana":
        payment_account = member.account

        if payment_account is None:
            raise AccountingError(
                f"Member account not found: {member.id}"
            )
    else:
        payment_account = recovery_account

    create_journal_entry(
        db,
        description=(
            f"Member due payment: {member.name}"
        ),
        entry_date=datetime.combine(
            due.due_date,
            datetime.min.time(),
        ),
        reference=reference_or_due_reference(
            due.reference,
            due.id,
        ),
        lines=[
            (cash_account.id, amount),
            (payment_account.id, -amount),
        ],
    )

    due.paid_amount += amount

    db.flush()

    return due


def reference_or_due_reference(
    reference: str | None,
    due_id: int,
) -> str:
    """
    Return the supplied due reference when available.

    Otherwise generate a stable payment reference from the
    MemberDue identifier.
    """

    if reference:
        return f"{reference}-PAYMENT"

    return f"DUE-{due_id}-PAYMENT"


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

def get_member_due_breakdown(
    db: Session,
    *,
    member_id: int,
) -> dict[str, int]:
    dues = get_member_dues(
        db,
        member_id=member_id,
    )

    ordinary_dues = sum(
        due.amount - due.paid_amount
        for due in dues
        if due.due_type == "ordinary"
    )

    qarz_e_hasana_dues = sum(
        due.amount - due.paid_amount
        for due in dues
        if due.due_type == "qarz_e_hasana"
    )

    return {
        "ordinary_dues": ordinary_dues,
        "qarz_e_hasana_dues": qarz_e_hasana_dues,
        "outstanding_dues": ordinary_dues + qarz_e_hasana_dues,
    }
