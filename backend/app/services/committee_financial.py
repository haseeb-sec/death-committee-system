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
    Return the financial position of a committee.

    Customer-facing values are returned as positive amounts.
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

    return {
        "committee_id": committee.id,
        "committee_name": committee.name,
        "is_active": committee.is_active,
        "cash_balance": cash_balance,
    }
