from sqlalchemy.orm import Session

from app.models import (
    AssetParticipation,
    Committee,
    CommitteeAsset,
    Member,
    MemberGood,
    User,
    UserCommitteeAccess,
    UserRole,
)
from app.services.accounting import AccountingError


def user_can_access_committee(
    db: Session,
    *,
    user: User,
    committee_id: int,
) -> bool:
    if user.role == UserRole.SUPER_ADMIN.value:
        return (
            db.query(Committee.id)
            .filter(
                Committee.id == committee_id,
                Committee.is_active.is_(True),
            )
            .first()
            is not None
        )

    return (
        db.query(UserCommitteeAccess.id)
        .join(
            Committee,
            Committee.id == UserCommitteeAccess.committee_id,
        )
        .filter(
            UserCommitteeAccess.user_id == user.id,
            UserCommitteeAccess.committee_id == committee_id,
            UserCommitteeAccess.is_active.is_(True),
            Committee.is_active.is_(True),
        )
        .first()
        is not None
    )


def require_committee_access(
    db: Session,
    *,
    user: User,
    committee_id: int,
) -> Committee:
    committee = db.get(Committee, committee_id)

    if committee is None or not committee.is_active:
        raise AccountingError(
            f"Committee not found: {committee_id}"
        )

    if not user_can_access_committee(
        db,
        user=user,
        committee_id=committee_id,
    ):
        raise AccountingError(
            f"Access denied to committee: {committee_id}"
        )

    return committee


def require_member_access(
    db: Session,
    *,
    user: User,
    member_id: int,
) -> Member:
    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    require_committee_access(
        db,
        user=user,
        committee_id=member.committee_id,
    )

    return member


def require_member_good_access(
    db: Session,
    *,
    user: User,
    good_id: int,
) -> MemberGood:
    good = db.get(MemberGood, good_id)

    if good is None:
        raise AccountingError(
            f"Member good not found: {good_id}"
        )

    require_member_access(
        db,
        user=user,
        member_id=good.member_id,
    )

    return good


def require_asset_access(
    db: Session,
    *,
    user: User,
    asset_id: int,
) -> CommitteeAsset:
    asset = db.get(CommitteeAsset, asset_id)

    if asset is None:
        raise AccountingError(
            f"Committee asset not found: {asset_id}"
        )

    require_committee_access(
        db,
        user=user,
        committee_id=asset.committee_id,
    )

    return asset


def require_asset_participation_access(
    db: Session,
    *,
    user: User,
    participation_id: int,
) -> AssetParticipation:
    participation = db.get(
        AssetParticipation,
        participation_id,
    )

    if participation is None:
        raise AccountingError(
            f"Asset participation not found: {participation_id}"
        )

    require_member_access(
        db,
        user=user,
        member_id=participation.member_id,
    )

    return participation


def grant_committee_access(
    db: Session,
    *,
    user: User,
    committee_id: int,
    granted_by_user: User,
) -> UserCommitteeAccess:
    require_committee_access(
        db,
        user=granted_by_user,
        committee_id=committee_id,
    )

    target_user = db.get(User, user.id)
    if target_user is None or not target_user.is_active:
        raise AccountingError(f"User not found or inactive: {user.id}")

    access = (
        db.query(UserCommitteeAccess)
        .filter(
            UserCommitteeAccess.user_id == user.id,
            UserCommitteeAccess.committee_id == committee_id,
        )
        .first()
    )

    if access is None:
        access = UserCommitteeAccess(
            user_id=user.id,
            committee_id=committee_id,
            granted_by_user_id=granted_by_user.id,
            is_active=True,
        )
        db.add(access)
    else:
        access.is_active = True
        access.granted_by_user_id = granted_by_user.id

    db.flush()
    return access
