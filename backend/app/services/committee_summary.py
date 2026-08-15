from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Account,
    AccountType,
    Committee,
    JournalEntry,
    JournalLine,
)
from app.services.accounting import AccountingError


def get_committee_summary(
    db: Session,
    *,
    committee_id: int,
) -> dict:
    """
    Return a simple financial summary for a committee.
    """

    committee = db.get(Committee, committee_id)

    if committee is None:
        raise AccountingError(
            f"Committee not found: {committee_id}"
        )

    cash_account = db.scalars(
        select(Account).where(
            Account.committee_id == committee_id,
            Account.account_type == AccountType.CASH,
            Account.member_id.is_(None),
        )
    ).first()

    if cash_account is None:
        raise AccountingError(
            f"Committee cash account not found: {committee_id}"
        )

    cash_lines = db.scalars(
        select(JournalLine).where(
            JournalLine.account_id == cash_account.id,
        )
    ).all()

    cash_balance = sum(line.amount for line in cash_lines)

    contribution_entries = db.scalars(
        select(JournalEntry)
        .join(
            JournalLine,
            JournalLine.journal_entry_id == JournalEntry.id,
        )
        .where(
            JournalLine.account_id == cash_account.id,
            JournalLine.amount > 0,
            JournalEntry.description.like("Member contribution:%"),
        )
    ).unique().all()

    total_contributions = sum(
        line.amount
        for entry in contribution_entries
        for line in entry.lines
        if line.account_id == cash_account.id
        and line.amount > 0
    )

    support_entries = db.scalars(
        select(JournalEntry)
        .join(
            JournalLine,
            JournalLine.journal_entry_id == JournalEntry.id,
        )
        .where(
            JournalLine.account_id == cash_account.id,
            JournalLine.amount < 0,
            JournalEntry.description.like("Death support:%"),
        )
    ).unique().all()

    total_death_support = sum(
        -line.amount
        for entry in support_entries
        for line in entry.lines
        if line.account_id == cash_account.id
        and line.amount < 0
    )

    return {
        "committee_id": committee.id,
        "committee_name": committee.name,
        "is_active": committee.is_active,
        "total_contributions": total_contributions,
        "total_death_support": total_death_support,
        "cash_balance": cash_balance,
    }
