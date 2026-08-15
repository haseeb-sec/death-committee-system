from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import JournalEntry, JournalLine, Member
from app.services.accounting import AccountingError


def get_member_statement(
    db: Session,
    *,
    member_id: int,
) -> list[dict]:
    """
    Return a simple customer-friendly statement for a member.

    Each row contains:
        date
        description
        reference
        amount

    Member contributions are stored as negative amounts internally,
    but are presented as positive amounts to the customer.
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
        .join(JournalLine.journal_entry)
        .where(
            JournalLine.account_id == member.account.id,
        )
        .order_by(
            JournalEntry.entry_date.asc(),
            JournalEntry.id.asc(),
        )
    ).all()

    statement = []

    for line in lines:
        entry = line.journal_entry

        statement.append(
            {
                "date": entry.entry_date.date(),
                "description": entry.description,
                "reference": entry.reference,
                "amount": -line.amount,
            }
        )

    return statement
