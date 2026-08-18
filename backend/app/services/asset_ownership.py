from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AssetOwnership, CommitteeAsset, Member
from app.services.accounting import AccountingError


def redistribute_member_asset_ownership(
    db: Session,
    *,
    member_id: int,
) -> None:
    """
    Remove a departing member from current asset ownership.

    Normal case:
        The departing member's ownership is redistributed equally
        among the remaining active owners.

    Sole-owner case:
        If the departing member is the only active owner of an asset,
        their ownership is removed. The asset remains active committee
        property but becomes temporarily unallocated.

    Historical AssetParticipation records are never modified.

    Current ownership is represented by AssetOwnership.
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
    ).all()

    for ownership in ownerships:
        other_owners = db.scalars(
            select(AssetOwnership)
            .join(
                Member,
                Member.id == AssetOwnership.member_id,
            )
            .where(
                AssetOwnership.asset_id == ownership.asset_id,
                AssetOwnership.member_id != member_id,
                AssetOwnership.ownership_units > 0,
                Member.is_active.is_(True),
            )
        ).all()

        # Remove the departing member from current ownership.
        ownership.ownership_units = 0

        if not other_owners:
            # The departing member was the only current owner.
            #
            # Do not give the asset to a later-joining member.
            # The asset remains committee property but currently
            # has no active owner.
            ownership.total_units = 0
            continue

        new_total_units = len(other_owners)

        ownership.total_units = new_total_units

        # Redistribute the departing member's ownership equally
        # among the remaining active owners.
        for other in other_owners:
            other.ownership_units = 1
            other.total_units = new_total_units

    db.flush()
