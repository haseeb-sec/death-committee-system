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


def get_member_asset_share(
    db: Session,
    *,
    member_id: int,
) -> int:
    """
    Return the current value of a member's historical
    ownership shares across all committee assets.

    Ownership is determined when each asset was purchased.
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
    ).all()

    total_share = 0

    for participation in participations:
        asset = participation.asset

        share = (
            asset.current_value
            * participation.ownership_units
            // participation.total_units
        )

        total_share += share

    return total_share
