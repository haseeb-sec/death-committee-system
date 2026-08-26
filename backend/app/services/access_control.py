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


def require_committee_admin_access(
    db: Session,
    *,
    user: User,
    committee_id: int,
) -> Committee:
    """
    Require management authority for one exact committee.

    SUPER_ADMIN:
        Global authority.

    COMMITTEE_ADMIN:
        Must have active committee access with is_admin=True.

    MEMBER:
        Never has committee-management authority.
    """

    committee = require_committee_access(
        db,
        user=user,
        committee_id=committee_id,
    )

    if user.role == UserRole.SUPER_ADMIN.value:
        return committee

    if user.role != UserRole.COMMITTEE_ADMIN.value:
        raise AccountingError(
            f"Administrative access denied to committee: {committee_id}"
        )

    access = (
        db.query(UserCommitteeAccess.id)
        .filter(
            UserCommitteeAccess.user_id == user.id,
            UserCommitteeAccess.committee_id == committee_id,
            UserCommitteeAccess.is_active.is_(True),
            UserCommitteeAccess.is_admin.is_(True),
        )
        .first()
    )

    if access is None:
        raise AccountingError(
            f"Administrative access denied to committee: {committee_id}"
        )

    return committee

def require_member_access(
    db: Session,
    *,
    user: User,
    member_id: int,
) -> Member:
    """
    SUPER_ADMIN:
        Can access any member.

    COMMITTEE_ADMIN:
        Can access members of assigned committees.

    MEMBER:
        Can access only their own Member record.
    """

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

    if user.role in (
        UserRole.SUPER_ADMIN.value,
        UserRole.COMMITTEE_ADMIN.value,
    ):
        return member

    if (
        user.role == UserRole.MEMBER.value
        and member.user_id == user.id
    ):
        return member

    raise AccountingError("Access denied to member record.")

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
    is_admin: bool = False,
) -> UserCommitteeAccess:
    """
    Final committee-access hierarchy.

    SUPER_ADMIN:
        Can grant normal access and assign Committee Admins.

    COMMITTEE_ADMIN:
        Can grant ordinary MEMBER access inside their own
        administered committee.

        Cannot create/promote Committee Admins.

    MEMBER:
        Cannot grant access.
    """

    committee = db.get(Committee, committee_id)

    if committee is None or not committee.is_active:
        raise AccountingError(
            f"Committee not found: {committee_id}"
        )

    target_user = user

    if target_user is None or not target_user.is_active:
        raise AccountingError(
            f"User not found or inactive: {user.id}"
        )

    # --------------------------------------------------------
    # SUPER ADMIN
    # --------------------------------------------------------

    if granted_by_user.role == UserRole.SUPER_ADMIN.value:

        if target_user.role == UserRole.SUPER_ADMIN.value:
            raise AccountingError(
                "Super Admin already has global committee access."
            )

        if is_admin and (
            target_user.role != UserRole.COMMITTEE_ADMIN.value
        ):
            raise AccountingError(
                "Only committee_admin users can be assigned "
                "as committee administrators."
            )

    # --------------------------------------------------------
    # COMMITTEE ADMIN
    # --------------------------------------------------------

    elif granted_by_user.role == UserRole.COMMITTEE_ADMIN.value:

        if is_admin:
            raise AccountingError(
                "Only Super Admin can assign committee administrator privileges."
            )

        admin_access = (
            db.query(UserCommitteeAccess.id)
            .filter(
                UserCommitteeAccess.user_id == granted_by_user.id,
                UserCommitteeAccess.committee_id == committee_id,
                UserCommitteeAccess.is_active.is_(True),
                UserCommitteeAccess.is_admin.is_(True),
            )
            .first()
        )

        if admin_access is None:
            raise AccountingError(
                "Committee administrator access required."
            )

        if target_user.role != UserRole.MEMBER.value:
            raise AccountingError(
                "Committee Admin can grant ordinary member access only."
            )

    else:
        raise AccountingError(
            "Only Super Admin or Committee Admin can grant committee access."
        )

    access = (
        db.query(UserCommitteeAccess)
        .filter(
            UserCommitteeAccess.user_id == target_user.id,
            UserCommitteeAccess.committee_id == committee_id,
        )
        .first()
    )

    if access is None:
        access = UserCommitteeAccess(
            user_id=target_user.id,
            committee_id=committee_id,
            granted_by_user_id=granted_by_user.id,
            is_active=True,
            is_admin=is_admin,
        )
        db.add(access)

    else:
        access.is_active = True
        access.granted_by_user_id = granted_by_user.id
        access.is_admin = is_admin

    db.flush()

    return access
