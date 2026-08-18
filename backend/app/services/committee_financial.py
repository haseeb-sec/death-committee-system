from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Account, AccountType, Committee, JournalLine
from app.services.accounting import AccountingError


def get_committee_financial_position(
    db: Session,
    *,
    committee_id: int,
) -> dict:
    """
    Return the committee's actual financial cash position.

    The cash balance is calculated directly from the committee
    cash account's journal lines.

    A negative value is intentionally preserved because it
    represents an accounting inconsistency or an overdrawn
    committee cash position. The reporting layer must never
    hide or silently correct ledger data.
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

    cash_balance = sum(
        line.amount
        for line in cash_lines
    )

    return {
        "committee_id": committee.id,
        "committee_name": committee.name,
        "is_active": committee.is_active,
        "cash_balance": cash_balance,
    }
