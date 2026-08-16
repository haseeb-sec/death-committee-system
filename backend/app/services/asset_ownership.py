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
    Remove a departing member from current asset ownership
    and redistribute that member's ownership equally among
    the remaining active members of the committee.

    Historical AssetParticipation records are never modified.

    Current ownership is represented by AssetOwnership.

    Example:

        Before:
            Member A = 1/3
            Member B = 1/3
            Member C = 1/3

        Member C leaves.

        After:
            Member A = 1/2
            Member B = 1/2
            Member C = 0

    The departing member's historical participation remains intact.
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

        if not other_owners:
            raise AccountingError(
                "Cannot redistribute asset ownership: "
                f"member {member_id} is the only active owner "
                f"of asset {ownership.asset_id}."
            )

        new_total_units = len(other_owners)

        # Remove the departing member's current ownership.
        ownership.ownership_units = 0
        ownership.total_units = new_total_units

        # Redistribute the asset equally among the
        # remaining active owners.
        for other in other_owners:
            other.ownership_units = 1
            other.total_units = new_total_units

    db.flush()
