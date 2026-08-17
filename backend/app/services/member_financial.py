from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    DeathSupport,
    Member,
    MemberSettlement,
)
from app.services.accounting import AccountingError
from app.services.asset_share import get_member_asset_share
from app.services.contribution import (
    get_member_contribution_total,
    get_member_contributions,
)
from app.services.member_balance import get_member_balance
from app.services.member_due import get_outstanding_dues
from app.services.member_good import get_member_goods_total


def get_member_financial_summary(
    db: Session,
    *,
    member_id: int,
) -> dict:
    """
    Return the complete current financial summary of a member.

    This combines the business-level financial components:

        Contributions
        Current refundable cash balance
        Death support
        Current committee asset share
        Current member-good value
        Outstanding dues
        Current settlement record, when one exists

    The endpoint is intentionally business-level so the frontend
    does not need to understand journal entries or accounting
    implementation details.
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

    contribution_balance = get_member_balance(
        db,
        member_id=member_id,
    )

    asset_share = get_member_asset_share(
        db,
        member_id=member_id,
    )

    goods_value = get_member_goods_total(
        db,
        member_id=member_id,
    )

    outstanding_dues = get_outstanding_dues(
        db,
        member_id=member_id,
    )

    death_support = db.scalars(
        select(DeathSupport)
        .where(
            DeathSupport.member_id == member_id,
        )
    ).first()

    settlement = db.scalars(
        select(MemberSettlement)
        .where(
            MemberSettlement.member_id == member_id,
        )
        .order_by(
            MemberSettlement.id.desc(),
        )
    ).first()

    current_gross_value = (
        contribution_balance
        + asset_share
        + goods_value
    )

    current_final_value = (
        current_gross_value
        - outstanding_dues
    )

    return {
        "member_id": member.id,
        "member_name": member.name,
        "joined_on": member.joined_on,
        "left_on": member.left_on,
        "is_active": member.is_active,

        "contribution_count": len(contributions),
        "total_contributions": total_contributions,

        "contribution_balance": contribution_balance,
        "asset_share": asset_share,
        "goods_value": goods_value,

        "outstanding_dues": outstanding_dues,

        "current_gross_value": current_gross_value,
        "current_final_value": current_final_value,

        "death_support": (
            None
            if death_support is None
            else {
                "id": death_support.id,
                "beneficiary_name": (
                    death_support.beneficiary_name
                ),
                "amount": death_support.amount,
                "support_date": death_support.support_date,
                "reference": death_support.reference,
            }
        ),

        "settlement": (
            None
            if settlement is None
            else {
                "id": settlement.id,
                "settlement_date": settlement.settlement_date,
                "contribution_balance": (
                    settlement.contribution_balance
                ),
                "asset_share": settlement.asset_share,
                "goods_value": settlement.goods_value,
                "gross_amount": settlement.gross_amount,
                "outstanding_dues": (
                    settlement.outstanding_dues
                ),
                "final_amount": settlement.final_amount,
                "status": settlement.status,
            }
        ),
    }
