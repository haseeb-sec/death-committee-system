from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    AssetOwnership,
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
    currently owned by a member.

    Current ownership comes from AssetOwnership.
    Historical participation is preserved separately.

    Share calculation is deterministic.

    If an asset cannot be divided equally into whole PKR
    amounts, the remainder is distributed one PKR at a time
    according to member_id order.

    Therefore:

        sum(all member shares) == asset.current_value

    No PKR is lost because of integer division.
    """

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    ownerships = db.scalars(
        select(AssetOwnership)
        .join(
            CommitteeAsset,
            CommitteeAsset.id == AssetOwnership.asset_id,
        )
        .where(
            AssetOwnership.member_id == member_id,
            AssetOwnership.ownership_units > 0,
            CommitteeAsset.is_active.is_(True),
        )
        .order_by(
            CommitteeAsset.purchase_date.asc(),
            CommitteeAsset.id.asc(),
        )
    ).all()

    breakdown = []

    for ownership in ownerships:
        asset = ownership.asset

        all_owners = db.scalars(
            select(AssetOwnership)
            .where(
                AssetOwnership.asset_id == asset.id,
                AssetOwnership.ownership_units > 0,
            )
            .order_by(
                AssetOwnership.member_id.asc(),
            )
        ).all()

        total_units = sum(
            owner.ownership_units
            for owner in all_owners
        )

        if total_units <= 0:
            raise AccountingError(
                f"Asset has invalid ownership units: {asset.id}"
            )

        member_units = ownership.ownership_units

        base_share = (
            asset.current_value
            * member_units
            // total_units
        )

        remainder = (
            asset.current_value
            % total_units
        )

        member_rank = sum(
            owner.ownership_units
            for owner in all_owners
            if owner.member_id < member_id
        )

        extra = 0

        if member_rank < remainder:
            extra = 1

        share_value = base_share + extra

        breakdown.append(
            {
                "asset_id": asset.id,
                "asset_name": asset.name,
                "current_value": asset.current_value,
                "ownership_units": member_units,
                "total_units": total_units,
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
    current committee asset ownership.
    """

    breakdown = get_member_asset_breakdown(
        db,
        member_id=member_id,
    )

    return sum(
        item["share_value"]
        for item in breakdown
    )
