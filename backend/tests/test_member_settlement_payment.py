from datetime import date

import pytest

from app.models import (
    Account,
    AccountType,
    JournalLine,
    MemberGood,
    MemberSettlement,
)
from app.services.accounting import AccountingError
from app.services.committee import create_committee
from app.services.contribution import record_contribution
from app.services.member import add_member, leave_member
from app.services.member_good import add_member_good
from app.services.member_settlement import pay_member_settlement


def add_rate(db, committee_id, amount):
    from app.models import ContributionRate

    rate = ContributionRate(
        committee_id=committee_id,
        amount=amount,
        effective_from=date(2026, 1, 1),
    )

    db.add(rate)
    db.flush()

    return rate


def test_member_settlement_payment_requires_sufficient_cash(db):
    committee = create_committee(
        db,
        name="Insufficient Cash Committee",
    )

    db.commit()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Member A",
        joined_on=date(2026, 1, 1),
    )

    add_rate(
        db,
        committee.id,
        amount=30000,
    )

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 8, 1),
        reference="AUG-A",
    )

    db.commit()

    good = add_member_good(
        db,
        member_id=member.id,
        name="Laptop",
        purchase_date=date(2026, 8, 2),
        purchase_price=10000,
    )

    db.commit()

    assert good.current_value == 10000

    leave_member(
        db,
        member_id=member.id,
        leaving_date=date(2026, 8, 10),
    )

    db.commit()

    settlement = db.query(MemberSettlement).filter(
        MemberSettlement.member_id == member.id
    ).one()

    assert settlement.contribution_balance == 20000
    assert settlement.goods_value == 10000
    assert settlement.final_amount == 30000
    assert settlement.status == "pending"

    with pytest.raises(
        AccountingError,
        match="Insufficient committee cash",
    ):
        pay_member_settlement(
            db,
            settlement_id=settlement.id,
        )

    db.rollback()

    settlement = db.query(MemberSettlement).filter(
        MemberSettlement.member_id == member.id
    ).one()

    assert settlement.status == "pending"

    active_good = db.query(MemberGood).filter(
        MemberGood.id == good.id
    ).one()

    assert active_good.is_active is True


def test_member_settlement_payment_closes_member_goods(db):
    committee = create_committee(
        db,
        name="Goods Payment Committee",
    )

    db.commit()

    member_a = add_member(
        db,
        committee_id=committee.id,
        name="Member A",
        joined_on=date(2026, 1, 1),
    )

    member_b = add_member(
        db,
        committee_id=committee.id,
        name="Member B",
        joined_on=date(2026, 1, 1),
    )

    add_rate(
        db,
        committee.id,
        amount=30000,
    )

    record_contribution(
        db,
        member_id=member_a.id,
        contribution_date=date(2026, 8, 1),
        reference="AUG-A",
    )

    record_contribution(
        db,
        member_id=member_b.id,
        contribution_date=date(2026, 8, 1),
        reference="AUG-B",
    )

    db.commit()

    good = add_member_good(
        db,
        member_id=member_a.id,
        name="Laptop",
        purchase_date=date(2026, 8, 2),
        purchase_price=10000,
    )

    db.commit()

    leave_member(
        db,
        member_id=member_a.id,
        leaving_date=date(2026, 8, 10),
    )

    db.commit()

    settlement = db.query(MemberSettlement).filter(
        MemberSettlement.member_id == member_a.id
    ).one()

    assert settlement.contribution_balance == 20000
    assert settlement.goods_value == 10000
    assert settlement.final_amount == 30000
    assert settlement.status == "pending"

    paid = pay_member_settlement(
        db,
        settlement_id=settlement.id,
    )

    assert paid.status == "paid"

    db.refresh(good)

    assert good.is_active is False

    member_lines = db.query(JournalLine).filter(
        JournalLine.account_id == member_a.account.id
    ).all()

    member_balance = sum(
        line.amount
        for line in member_lines
    )

    assert member_balance == 0

    settlement_lines = (
        db.query(JournalLine)
        .join(JournalLine.journal_entry)
        .filter(
            JournalLine.journal_entry.has(
                reference=f"SETTLEMENT-{settlement.id}"
            )
        )
        .all()
    )

    assert sum(
        line.amount
        for line in settlement_lines
    ) == 0


def test_member_settlement_payment_cannot_be_paid_twice(db):
    committee = create_committee(
        db,
        name="Double Payment Committee",
    )

    db.commit()

    member_a = add_member(
        db,
        committee_id=committee.id,
        name="Member A",
        joined_on=date(2026, 1, 1),
    )

    member_b = add_member(
        db,
        committee_id=committee.id,
        name="Member B",
        joined_on=date(2026, 1, 1),
    )

    add_rate(
        db,
        committee.id,
        amount=30000,
    )

    record_contribution(
        db,
        member_id=member_a.id,
        contribution_date=date(2026, 8, 1),
        reference="AUG-A",
    )

    record_contribution(
        db,
        member_id=member_b.id,
        contribution_date=date(2026, 8, 1),
        reference="AUG-B",
    )

    db.commit()

    leave_member(
        db,
        member_id=member_a.id,
        leaving_date=date(2026, 8, 10),
    )

    db.commit()

    settlement = db.query(MemberSettlement).filter(
        MemberSettlement.member_id == member_a.id
    ).one()

    paid = pay_member_settlement(
        db,
        settlement_id=settlement.id,
    )

    assert paid.status == "paid"

    with pytest.raises(
        AccountingError,
        match="Settlement is not pending",
    ):
        pay_member_settlement(
            db,
            settlement_id=settlement.id,
        )
