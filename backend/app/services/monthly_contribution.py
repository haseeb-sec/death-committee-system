from calendar import monthrange
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ContributionRate, Member
from app.services.accounting import AccountingError
from app.services.contribution import get_member_contributions


def get_monthly_contribution_status(
    db: Session,
    *,
    committee_id: int,
    year: int,
    month: int,
) -> list[dict]:
    """
    Return monthly contribution status for committee members.

    A member is either:
        paid
        not_paid

    A contribution counts as paid when the full applicable
    contribution rate has been recorded during the month.
    """

    if month < 1 or month > 12:
        raise AccountingError(
            "Month must be between 1 and 12."
        )

    month_start = date(year, month, 1)
    month_end = date(
        year,
        month,
        monthrange(year, month)[1],
    )

    members = db.scalars(
        select(Member)
        .where(
            Member.committee_id == committee_id,
        )
        .order_by(Member.id.asc())
    ).all()

    rate = db.scalars(
        select(ContributionRate)
        .where(
            ContributionRate.committee_id == committee_id,
            ContributionRate.effective_from <= month_end,
        )
        .order_by(
            ContributionRate.effective_from.desc()
        )
    ).first()

    if rate is None:
        raise AccountingError(
            f"No contribution rate found for committee: "
            f"{committee_id}"
        )

    results = []

    for member in members:
        if member.joined_on > month_end:
            continue

        if member.left_on is not None and member.left_on < month_start:
            continue

        paid_amount = 0

        contributions = get_member_contributions(
            db,
            member_id=member.id,
        )

        for entry in contributions:
            contribution_date = entry.entry_date.date()

            if month_start <= contribution_date <= month_end:
                for line in entry.lines:
                    if (
                        line.account_id == member.account.id
                        and line.amount < 0
                    ):
                        paid_amount += -line.amount

        paid = paid_amount >= rate.amount

        results.append(
            {
                "member_id": member.id,
                "member_name": member.name,
                "year": year,
                "month": month,
                "expected_amount": rate.amount,
                "paid_amount": paid_amount,
                "status": "paid" if paid else "not_paid",
            }
        )

    return results
