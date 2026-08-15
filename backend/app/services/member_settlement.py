from sqlalchemy.orm import Session

from app.services.asset_share import (
    get_member_asset_breakdown,
    get_member_asset_share,
)
from app.services.member_balance import get_member_balance
from app.services.member_due import get_outstanding_dues
from app.services.member_good import get_member_goods_total


def get_member_settlement(
    db: Session,
    *,
    member_id: int,
) -> dict:
    """
    Calculate a complete financial settlement for a member.

    Customer-facing calculation:

        Contribution balance
        + Committee asset share
        + Member goods current value
        - Outstanding dues
        = Final settlement
    """

    contribution_balance = get_member_balance(
        db,
        member_id=member_id,
    )

    asset_breakdown = get_member_asset_breakdown(
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

    gross_amount = (
        contribution_balance
        + asset_share
        + goods_value
    )

    final_amount = gross_amount - outstanding_dues

    return {
        "member_id": member_id,
        "contribution_balance": contribution_balance,
        "asset_share": asset_share,
        "asset_breakdown": asset_breakdown,
        "goods_value": goods_value,
        "outstanding_dues": outstanding_dues,
        "gross_amount": gross_amount,
        "final_amount": final_amount,
    }
