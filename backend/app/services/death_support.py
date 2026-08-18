from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Account,
    AccountType,
    DeathSupport,
    JournalLine,
    Member,
    MemberDue,
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
    Record death support for a member.

    The death-support operation represents the point at which
    the member's death is recorded.

    Workflow:

        Active member
            ->
        Death support recorded
            ->
        Member becomes inactive
            ->
        Remaining member balance can later be settled.

    Accounting:

        Committee Cash   -amount
        Member Account   +amount

    The support record preserves the business-level history.
    The journal entry preserves the financial history.

    The support amount reduces the member's refundable balance.
    It does not erase the member account or perform the final
    settlement.
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

    if not member.is_active:
        raise AccountingError(
            f"Member is already inactive: {member_id}"
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

    cash_balance = sum(
        line.amount
        for line in db.scalars(
            select(JournalLine).where(
                JournalLine.account_id == cash_account.id,
            )
        ).all()
    )

    if cash_balance < amount:
        raise AccountingError(
            f"Insufficient committee cash. "
            f"Required: {amount}, available: {cash_balance}"
        )

    member_balance = -sum(
        line.amount
        for line in member.account.journal_lines
    )

    member_funded_amount = max(
        min(member_balance, amount),
        0,
    )

    qarz_e_hasana_amount = amount - member_funded_amount

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
        member_funded_amount=member_funded_amount,
        qarz_e_hasana_amount=qarz_e_hasana_amount,
        support_date=support_date,
        reference=reference,
    )

    db.add(support)

    if qarz_e_hasana_amount > 0:
        db.add(
            MemberDue(
                committee_id=member.committee_id,
                member_id=member.id,
                amount=qarz_e_hasana_amount,
                paid_amount=0,
                due_date=support_date,
                description=(
                    "Qarz-e-Hasana death support "
                    f"for {member.name}"
                ),
                due_type="qarz_e_hasana",
                reference=reference,
            )
        )

    # Recording death support marks the member as deceased/inactive.
    member.is_active = False

    if member.left_on is None:
        member.left_on = support_date

    db.flush()

    return support


def get_member_death_support(
    db: Session,
    *,
    member_id: int,
) -> DeathSupport:
    """
    Return the death-support record for a member.

    Each member can have at most one death-support record.
    """

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    support = db.scalars(
        select(DeathSupport)
        .where(
            DeathSupport.member_id == member_id,
        )
    ).first()

    if support is None:
        raise AccountingError(
            f"Death support not found for member: {member_id}"
        )

    return support
