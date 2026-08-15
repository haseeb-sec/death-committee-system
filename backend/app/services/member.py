from datetime import date

from sqlalchemy.orm import Session

from app.models import Account, AccountType, Committee, Member
from app.services.accounting import AccountingError


def add_member(
    db: Session,
    *,
    committee_id: int,
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

    member = Member(
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


def leave_member(
    db: Session,
    *,
    member_id: int,
    leaving_date: date,
) -> Member:
    """
    Mark a member as having left the committee.

    The member and their account are preserved so that
    historical transactions remain available.
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

    from app.services.member_due import get_outstanding_dues

    outstanding_dues = get_outstanding_dues(
        db,
        member_id=member_id,
    )

    if outstanding_dues > 0:
        raise AccountingError(
            f"Member has outstanding dues: "
            f"{outstanding_dues}"
        )

    if leaving_date < member.joined_on:
        raise AccountingError(
            "Leaving date cannot be before joining date."
        )

    member.left_on = leaving_date
    member.is_active = False

    db.flush()

    return member
