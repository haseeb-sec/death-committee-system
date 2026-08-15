from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Account,
    AccountType,
    DeathSupport,
    Member,
)
from app.services.accounting import AccountingError, create_journal_entry


def record_death_support(
    db: Session,
    *,
    member_id: int,
    beneficiary_name: str,
    amount: int,
    support_date: date,
    reference: str | None = None,
) -> DeathSupport:
    """
    Record death support paid for a member.

    Accounting:

        Committee Cash   -amount
        Member Account   +amount

    The support record preserves the business-level history.
    The journal entry preserves the financial history.
    """

    beneficiary_name = beneficiary_name.strip()

    if not beneficiary_name:
        raise AccountingError(
            "Beneficiary name cannot be empty."
        )

    if amount <= 0:
        raise AccountingError(
            "Death support amount must be greater than zero."
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

    if member.is_active:
        raise AccountingError(
            f"Member must be inactive before death support can be recorded: {member_id}"
        )

    if member.account is None:
        raise AccountingError(
            f"Member account not found: {member_id}"
        )

    existing_support = db.scalars(
        select(DeathSupport).where(
            DeathSupport.member_id == member_id
        )
    ).first()

    if existing_support is not None:
        raise AccountingError(
            f"Death support already recorded for member: {member_id}"
        )

    cash_account = db.scalars(
        select(Account).where(
            Account.account_type == AccountType.CASH,
            Account.committee_id == member.committee_id,
            Account.member_id.is_(None),
        )
    ).first()

    if cash_account is None:
        raise AccountingError(
            "Committee cash account not found."
        )

    journal_entry = create_journal_entry(
        db,
        description=f"Death support: {member.name}",
        entry_date=datetime.combine(
            support_date,
            datetime.min.time(),
        ),
        reference=reference,
        lines=[
            (cash_account.id, -amount),
            (member.account.id, amount),
        ],
    )

    support = DeathSupport(
        committee_id=member.committee_id,
        member_id=member.id,
        beneficiary_name=beneficiary_name,
        amount=amount,
        support_date=support_date,
        reference=reference,
    )

    db.add(support)
    db.flush()

    return support
