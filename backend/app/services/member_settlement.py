from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Member, MemberSettlement
from app.services.accounting import AccountingError
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
    Calculate the current financial settlement for a member.
    """

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

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


def settle_member(
    db: Session,
    *,
    member_id: int,
    settlement_date: date,
) -> MemberSettlement:
    """
    Permanently settle a member.

    A member cannot be settled while they have outstanding dues.
    The settlement stores a snapshot of the member's financial
    position at the time of settlement.
    """

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    if not member.is_active:
        raise AccountingError(
            f"Member is already inactive: {member_id}"
        )

    existing = db.scalars(
        select(MemberSettlement)
        .where(
            MemberSettlement.member_id == member_id,
        )
    ).first()

    if existing is not None:
        raise AccountingError(
            f"Member has already been settled: {member_id}"
        )

    settlement = get_member_settlement(
        db,
        member_id=member_id,
    )

    if settlement["outstanding_dues"] > 0:
        raise AccountingError(
            f"Member has outstanding dues: "
            f"{settlement['outstanding_dues']}"
        )

    record = MemberSettlement(
        member_id=member_id,
        settlement_date=settlement_date,
        contribution_balance=settlement["contribution_balance"],
        asset_share=settlement["asset_share"],
        goods_value=settlement["goods_value"],
        gross_amount=settlement["gross_amount"],
        outstanding_dues=settlement["outstanding_dues"],
        final_amount=settlement["final_amount"],
        status="completed",
    )

    db.add(record)

    member.is_active = False
    member.left_on = settlement_date

    db.flush()

    return record
