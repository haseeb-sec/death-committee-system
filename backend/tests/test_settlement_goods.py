from datetime import date

from app.models import (
    Account,
    AccountType,
    MemberGood,
    MemberSettlement,
)
from app.services.committee import create_committee
from app.services.contribution import record_contribution
from app.services.member import add_member, leave_member
from app.services.member_good import add_member_good, get_member_goods
from app.services.member_settlement import (
    get_member_settlement,
    pay_member_settlement,
)


def add_rate(db, committee_id, amount=30000):
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

    return sum(
        line.amount
        for line in account.journal_lines
    )


def test_member_good_is_closed_after_settlement(db):
    committee = create_committee(
        db,
        name="Goods Settlement Committee",
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

    # The member's 10,000 good purchase converts 10,000
    # of the member's cash entitlement into a member-owned good.
    #
    # After that purchase the committee has only 20,000 cash,
    # while the member's total settlement entitlement remains
    # 30,000. A successful payment therefore requires another
    # 10,000 of committee liquidity.
    #
    # This second member provides that liquidity.
    member_b = add_member(
        db,
        committee_id=committee.id,
        name="Member B",
        joined_on=date(2026, 1, 1),
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
        member_id=member.id,
        name="Laptop",
        purchase_date=date(2026, 8, 2),
        purchase_price=10000,
    )

    db.commit()

    assert good.current_value == 10000

    active_goods = get_member_goods(
        db,
        member_id=member.id,
    )

    assert len(active_goods) == 1
    assert active_goods[0].id == good.id

    settlement_preview = get_member_settlement(
        db,
        member_id=member.id,
    )

    assert settlement_preview["contribution_balance"] == 20000
    assert settlement_preview["goods_value"] == 10000
    assert settlement_preview["final_amount"] == 30000

    leave_member(
        db,
        member_id=member.id,
        leaving_date=date(2026, 8, 10),
    )

    db.commit()

    settlement = db.query(MemberSettlement).filter(
        MemberSettlement.member_id == member.id
    ).one()

    assert settlement.goods_value == 10000
    assert settlement.final_amount == 30000
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

    goods_after_payment = db.query(MemberGood).filter(
        MemberGood.member_id == member.id
    ).all()

    assert len(goods_after_payment) == 1

    assert goods_after_payment[0].is_active is False

    assert get_member_goods(
        db,
        member_id=member.id,
    ) == []

    # Member B still has 30,000 of refundable value in the
    # committee. Therefore the committee correctly retains
    # 20,000 cash after paying Member A's 30,000 settlement.
    assert cash_balance(
        db,
        committee.id,
    ) == 20000
