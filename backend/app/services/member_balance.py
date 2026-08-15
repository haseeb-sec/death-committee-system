from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import JournalLine, Member
from app.services.accounting import AccountingError


def get_member_balance(
    db: Session,
    *,
    member_id: int,
) -> int:
    """
    Return the current balance of a member's account.

    The member account uses accounting-style signed amounts.
    Contributions are negative amounts, so the customer-facing
    balance is returned as a positive value.
    """

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    if member.account is None:
        raise AccountingError(
            f"Member account not found: {member_id}"
        )

    lines = db.scalars(
        select(JournalLine)
        .where(
            JournalLine.account_id == member.account.id,
        )
    ).all()

    return -sum(line.amount for line in lines)
