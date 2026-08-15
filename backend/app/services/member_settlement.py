from app.services.accounting import AccountingError
from app.services.contribution import get_member_contribution_total
from app.services.member_balance import get_member_balance
from app.db.session import SessionLocal
from app.models import Member


def get_member_settlement(
    db,
    *,
    member_id: int,
) -> dict:
    """
    Calculate a member's financial settlement position.

    This is a calculation only.
    It does not issue a refund or create accounting entries.
    """

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    total_contributed = get_member_contribution_total(
        db,
        member_id=member_id,
    )

    remaining_balance = get_member_balance(
        db,
        member_id=member_id,
    )

    amount_used = total_contributed - remaining_balance

    return {
        "member_id": member.id,
        "member_name": member.name,
        "joined_on": member.joined_on,
        "left_on": member.left_on,
        "is_active": member.is_active,
        "total_contributed": total_contributed,
        "amount_used": amount_used,
        "remaining_balance": remaining_balance,
    }
