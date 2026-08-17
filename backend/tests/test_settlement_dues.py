from datetime import date

import pytest

from app.models import (
    Account,
    AccountType,
    MemberDue,
    MemberSettlement,
)
from app.services.accounting import AccountingError
from app.services.committee import create_committee
from app.services.contribution import record_contribution
from app.services.member import add_member, leave_member
from app.services.member_due import add_member_due, pay_member_due
from app.services.member_settlement import pay_member_settlement


def add_rate(db, committee_id, amount=2000):
    from app.models import ContributionRate

    rate = ContributionRate(
        committee_id=committee_id,
        amount=amount,
        effective_from=date(2026, 1, 1),
    )

    db.add(rate)
    db.flush()

    return rate


def cash_balance(db, committee_id):
    account = db.query(Account).filter(
        Account.committee_id == committee_id,
        Account.account_type == AccountType.CASH,
        Account.member_id.is_(None),
    ).one()

    return sum(line.amount for line in account.journal_lines)


def test_member_with_outstanding_due_cannot_be_settled(db):
    committee = create_committee(
        db,
        name="Due Test Committee",
    )

    member = add_member(
        db,
        committee_id=committee.id,
        name="Due Member",
        joined_on=date(2026, 1, 1),
    )

    add_rate(db, committee.id)

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 8, 1),
        reference="AUG-DUE",
    )

    add_member_due(
        db,
        member_id=member.id,
        amount=500,
        due_date=date(2026, 8, 5),
        description="Test outstanding due",
    )

    db.commit()

    with pytest.raises(
        AccountingError,
        match="outstanding dues",
    ):
        leave_member(
            db,
            member_id=member.id,
            leaving_date=date(2026, 8, 10),
        )

    db.rollback()

    assert member.is_active is True

    settlement = db.query(MemberSettlement).filter(
        MemberSettlement.member_id == member.id
    ).first()

    assert settlement is None


def test_member_due_payment_allows_settlement(db):
    committee = create_committee(
        db,
        name="Due Paid Test Committee",
    )

    member = add_member(
        db,
        committee_id=committee.id,
        name="Paid Due Member",
        joined_on=date(2026, 1, 1),
    )

    add_rate(db, committee.id)

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 8, 1),
        reference="AUG-PAID-DUE",
    )

    due = add_member_due(
        db,
        member_id=member.id,
        amount=500,
        due_date=date(2026, 8, 5),
        description="Test due",
    )

    db.commit()

    assert cash_balance(db, committee.id) == 2000

    pay_member_due(
        db,
        due_id=due.id,
        amount=500,
    )

    db.commit()

    due = db.get(MemberDue, due.id)

    assert due.paid_amount == 500
    assert due.amount == 500

    assert cash_balance(db, committee.id) == 2500

    leave_member(
        db,
        member_id=member.id,
        leaving_date=date(2026, 8, 10),
    )

    db.commit()

    settlement = db.query(MemberSettlement).filter(
        MemberSettlement.member_id == member.id
    ).one()

    assert settlement.contribution_balance == 2000
    assert settlement.asset_share == 0
    assert settlement.goods_value == 0
    assert settlement.outstanding_dues == 0
    assert settlement.final_amount == 2000
    assert settlement.status == "pending"

    pay_member_settlement(
        db,
        settlement_id=settlement.id,
    )

    db.commit()

    settlement = db.get(
        MemberSettlement,
        settlement.id,
    )

    assert settlement.status == "paid"

    assert cash_balance(db, committee.id) == 500
