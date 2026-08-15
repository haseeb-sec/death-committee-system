from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CommitteeAsset, Member
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

    return sum(asset.current_value for asset in assets)


def get_active_member_count(
    db: Session,
    *,
    committee_id: int,
) -> int:
    """
    Return the number of currently active members.
    """

    members = db.scalars(
        select(Member)
        .where(
            Member.committee_id == committee_id,
            Member.is_active.is_(True),
        )
    ).all()

    return len(members)


def get_member_asset_share(
    db: Session,
    *,
    member_id: int,
) -> int:
    """
    Calculate an active member's equal share of committee assets.

    Asset ownership is divided equally among active members.
    """

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    member_count = get_active_member_count(
        db,
        committee_id=member.committee_id,
    )

    if member_count == 0:
        return 0

    total_asset_value = get_committee_asset_value(
        db,
        committee_id=member.committee_id,
    )

    return total_asset_value // member_count
