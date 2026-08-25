from datetime import date

from sqlalchemy.orm import Session

from app.models import Account, AccountType, Committee, Member, User, UserRole
from app.services.accounting import AccountingError
from app.services.auth import hash_password


def add_member(
    db: Session,
    *,
    committee_id: int,
    username: str | None = None,
    password: str | None = None,
    name: str,
    joined_on: date,
) -> Member:
    """
    Add a member to a committee and create the member's account.
    """

    name = name.strip()

    if not name:
        raise AccountingError(
            "Member name cannot be empty."
        )

    committee = db.get(Committee, committee_id)

    if committee is None:
        raise AccountingError(
            f"Committee not found: {committee_id}"
        )

    if not committee.is_active:
        raise AccountingError(
            f"Committee is not active: {committee_id}"
        )

    # Backward-compatible internal/test creation:
    # the Member identity model still always creates a real User.
    if username is None:
        import secrets
        username = f"member_{secrets.token_hex(12)}"

    username = username.strip()

    if not username:
        raise AccountingError(
            "Username cannot be empty."
        )

    if password is None:
        import secrets
        password = secrets.token_urlsafe(32)

    if not password:
        raise AccountingError(
            "Password cannot be empty."
        )

    existing_user = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if existing_user is not None:
        raise AccountingError(
            f"Username already exists: {username}"
        )

    user = User(
        username=username,
        password_hash=hash_password(password),
        role=UserRole.MEMBER.value,
        is_active=True,
    )
    db.add(user)
    db.flush()

    user_id = user.id

    member = Member(
        user_id=user_id,
        committee_id=committee_id,
        name=name,
        joined_on=joined_on,
        is_active=True,
    )

    db.add(member)
    db.flush()

    account = Account(
        name=f"Member: {name}",
        account_type=AccountType.MEMBER,
        committee_id=committee_id,
        member_id=member.id,
    )

    db.add(account)
    db.flush()

    return member


def list_members(
    db: Session,
    *,
    committee_id: int,
) -> list[Member]:
    """Return all members belonging to a committee."""

    return (
        db.query(Member)
        .filter(Member.committee_id == committee_id)
        .order_by(Member.id)
        .all()
    )


def leave_member(
    db: Session,
    *,
    member_id: int,
    leaving_date: date,
) -> Member:
    """
    Leave a member from the committee.

    This operation performs the complete settlement workflow:

        1. Validate the member.
        2. Validate outstanding dues.
        3. Calculate the member's final settlement.
        4. Create a pending settlement record.
        5. Mark the member inactive.
        6. Redistribute current committee-asset ownership.

    Actual cash payment remains a separate operation through
    pay_member_settlement().
    """

    from app.services.member_settlement import settle_member

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    if not member.is_active:
        raise AccountingError(
            f"Member is already inactive: {member_id}"
        )

    if leaving_date < member.joined_on:
        raise AccountingError(
            "Leaving date cannot be before joining date."
        )

    # settle_member() performs the financial validation,
    # including outstanding dues and settlement calculation.
    settle_member(
        db,
        member_id=member_id,
        settlement_date=leaving_date,
    )

    db.flush()

    return member
