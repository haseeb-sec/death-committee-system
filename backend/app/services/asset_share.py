from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    AssetParticipation,
    CommitteeAsset,
    Member,
)
from app.services.accounting import AccountingError


def get_committee_asset_value(
    db: Session,
    *,
    committee_id: int,
) -> int:
    """
    Return the current value of all active committee assets.
    """

    assets = db.scalars(
        select(CommitteeAsset)
        .where(
            CommitteeAsset.committee_id == committee_id,
            CommitteeAsset.is_active.is_(True),
        )
    ).all()

    return sum(
        asset.current_value
        for asset in assets
    )


def get_member_asset_breakdown(
    db: Session,
    *,
    member_id: int,
) -> list[dict]:
    """
    Return the current value of every asset share
    belonging to a member.

    Ownership comes from historical participation.
    """

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    participations = db.scalars(
        select(AssetParticipation)
        .join(
            CommitteeAsset,
            CommitteeAsset.id == AssetParticipation.asset_id,
        )
        .where(
            AssetParticipation.member_id == member_id,
            CommitteeAsset.is_active.is_(True),
        )
        .order_by(
            CommitteeAsset.purchase_date.asc(),
            CommitteeAsset.id.asc(),
        )
    ).all()

    breakdown = []

    for participation in participations:
        asset = participation.asset

        share_value = (
            asset.current_value
            * participation.ownership_units
            // participation.total_units
        )

        breakdown.append(
            {
                "asset_id": asset.id,
                "asset_name": asset.name,
                "current_value": asset.current_value,
                "ownership_units": participation.ownership_units,
                "total_units": participation.total_units,
                "share_value": share_value,
            }
        )

    return breakdown


def get_member_asset_share(
    db: Session,
    *,
    member_id: int,
) -> int:
    """
    Return the current total value of a member's
    historical committee asset ownership.
    """

    breakdown = get_member_asset_breakdown(
        db,
        member_id=member_id,
    )

    return sum(
        item["share_value"]
        for item in breakdown
    )
