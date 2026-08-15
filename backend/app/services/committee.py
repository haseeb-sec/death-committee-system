from sqlalchemy.orm import Session

from app.models import Account, AccountType, Committee
from app.services.accounting import AccountingError


def create_committee(
    db: Session,
    *,
    name: str,
) -> Committee:
    """
    Create a committee and its cash account.
    """

    name = name.strip()

    if not name:
        raise AccountingError(
            "Committee name cannot be empty."
        )

    committee = Committee(
        name=name,
        is_active=True,
    )

    db.add(committee)
    db.flush()

    cash_account = Account(
        name=f"Cash: {name}",
        account_type=AccountType.CASH,
        committee_id=committee.id,
        member_id=None,
    )

    db.add(cash_account)
    db.flush()

    return committee
