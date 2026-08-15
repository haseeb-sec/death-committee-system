from sqlalchemy.orm import Session

from app.models import Member
from app.services.accounting import AccountingError
from app.services.contribution import (
    get_member_contribution_total,
    get_member_contributions,
)


def get_member_financial_summary(
    db: Session,
    *,
    member_id: int,
) -> dict:
    """
    Return the current financial summary of a member.

    This is intentionally kept at the business level so the
    frontend can use it without understanding accounting details.
    """

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    contributions = get_member_contributions(
        db,
        member_id=member_id,
    )

    total_contributions = get_member_contribution_total(
        db,
        member_id=member_id,
    )

    return {
        "member_id": member.id,
        "member_name": member.name,
        "joined_on": member.joined_on,
        "left_on": member.left_on,
        "is_active": member.is_active,
        "contribution_count": len(contributions),
        "total_contributions": total_contributions,
    }
