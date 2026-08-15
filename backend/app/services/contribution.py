from datetime import date, datetime

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models import (
    Account,
    AccountType,
    ContributionRate,
    JournalEntry,
    JournalLine,
    Member,
)
from app.services.accounting import AccountingError, create_journal_entry


def record_contribution(
    db: Session,
    *,
    member_id: int,
    contribution_date: date,
    reference: str | None = None,
):
    """
    Record a member contribution using the applicable contribution rate.

    The contribution creates one balanced journal entry:

        Committee Cash   +amount
        Member Account   -amount
    """

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    if not member.is_active:
        raise AccountingError(
            f"Member is not active: {member_id}"
        )

    if contribution_date < member.joined_on:
        raise AccountingError(
            "Contribution date cannot be before member joining date."
        )

    rate = db.scalars(
        select(ContributionRate)
        .where(
            ContributionRate.committee_id == member.committee_id,
            ContributionRate.effective_from <= contribution_date,
        )
        .order_by(
            ContributionRate.effective_from.desc()
        )
    ).first()

    if rate is None:
        raise AccountingError(
            f"No contribution rate found for committee: "
            f"{member.committee_id}"
        )

    if member.account is None:
        raise AccountingError(
            f"Member account not found: {member_id}"
        )

    cash_account = db.scalars(
        select(Account)
        .where(
            Account.account_type == AccountType.CASH,
            Account.committee_id == member.committee_id,
            Account.member_id.is_(None),
        )
    ).first()

    if cash_account is None:
        raise AccountingError(
            "Committee cash account not found."
        )

    entry = create_journal_entry(
        db,
        description=f"Member contribution: {member.name}",
        entry_date=datetime.combine(
            contribution_date,
            datetime.min.time(),
        ),
        reference=reference,
        lines=[
            (cash_account.id, rate.amount),
            (member.account.id, -rate.amount),
        ],
    )

    return entry


def get_member_contributions(
    db: Session,
    *,
    member_id: int,
) -> list[JournalEntry]:
    """
    Return journal entries representing contributions made by a member.

    Results are ordered from oldest to newest contribution.
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

    entries = db.scalars(
        select(JournalEntry)
        .join(JournalLine, JournalLine.journal_entry_id == JournalEntry.id)
        .where(
            and_(
                JournalLine.account_id == member.account.id,
                JournalLine.amount < 0,
                JournalEntry.description
                == f"Member contribution: {member.name}",
            )
        )
        .order_by(JournalEntry.entry_date.asc())
    ).unique().all()

    return entries
