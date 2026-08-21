from sqlalchemy.orm import Session

from app.models import (
    Account,
    AccountType,
    Committee,
    UserCommitteeAccess,
    UserRole,
)
from app.services.accounting import AccountingError


def create_committee(
    db: Session,
    *,
    name: str,
) -> Committee:
    """
    Create a committee and its core accounting accounts.

    Every committee receives:
        - Cash account
        - Recovery account
        - Settlement expense account

    Member accounts and asset accounts are created separately.
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

    recovery_account = Account(
        name=f"Recovery: {name}",
        account_type=AccountType.RECOVERY,
        committee_id=committee.id,
        member_id=None,
    )

    settlement_expense_account = Account(
        name=f"Settlement Expense: {name}",
        account_type=AccountType.EXPENSE,
        committee_id=committee.id,
        member_id=None,
    )

    db.add(cash_account)
    db.add(recovery_account)
    db.add(settlement_expense_account)
    db.flush()

    return committee


def list_committees(
    db: Session,
    *,
    user,
) -> list[Committee]:
    """
    Return active committees accessible to the authenticated user.

    Super administrators can access every active committee.
    Other users can access only committees explicitly granted
    through UserCommitteeAccess.
    """

    query = (
        db.query(Committee)
        .filter(Committee.is_active.is_(True))
        .order_by(Committee.id)
    )

    if user.role == UserRole.SUPER_ADMIN.value:
        return query.all()

    return (
        query.join(
            UserCommitteeAccess,
            UserCommitteeAccess.committee_id == Committee.id,
        )
        .filter(
            UserCommitteeAccess.user_id == user.id,
            UserCommitteeAccess.is_active.is_(True),
        )
        .all()
    )


def close_committee(
    db: Session,
    *,
    committee_id: int,
) -> Committee:
    """
    Close an active committee without deleting its historical data.
    """

    committee = db.get(Committee, committee_id)

    if committee is None:
        raise AccountingError(
            f"Committee not found: {committee_id}"
        )

    if not committee.is_active:
        raise AccountingError(
            f"Committee is already inactive: {committee_id}"
        )

    committee.is_active = False

    db.flush()

    return committee
