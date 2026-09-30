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
from app.services.member_good import (
    add_member_good,
    get_good_valuations,
    get_member_goods,
    update_member_good_value,
)
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

def test_member_good_valuation_cannot_go_backwards(db):
    committee = create_committee(
        db,
        name="Good Valuation Committee",
    )

    db.commit()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Valuation Member",
        joined_on=date(2026, 1, 1),
    )

    add_rate(
        db,
        committee.id,
        amount=10000,
    )

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 8, 1),
        reference="VALUATION-TEST",
    )

    db.commit()

    good = add_member_good(
        db,
        member_id=member.id,
        name="Valuation Laptop",
        purchase_date=date(2026, 8, 1),
        purchase_price=10000,
    )

    db.commit()

    update_member_good_value(
        db,
        good_id=good.id,
        valuation_date=date(2026, 8, 10),
        new_value=12000,
    )
    db.commit()

    update_member_good_value(
        db,
        good_id=good.id,
        valuation_date=date(2026, 8, 11),
        new_value=13000,
    )
    db.commit()

    try:
        update_member_good_value(
            db,
            good_id=good.id,
            valuation_date=date(2026, 8, 10),
            new_value=9000,
        )
    except Exception as exc:
        assert "latest valuation date" in str(exc)
    else:
        raise AssertionError(
            "Expected an earlier valuation date to be rejected."
        )

    db.refresh(good)

    assert good.current_value == 13000

    valuations = get_good_valuations(
        db,
        good_id=good.id,
    )

    assert len(valuations) == 3
    assert valuations[0].valuation_date == date(2026, 8, 1)
    assert valuations[0].value == 10000
    assert valuations[1].valuation_date == date(2026, 8, 10)
    assert valuations[1].value == 12000
    assert valuations[2].valuation_date == date(2026, 8, 11)
    assert valuations[2].value == 13000

def test_member_good_valuation_duplicate_date_rejected(db):
    committee = create_committee(
        db,
        name="Duplicate Good Valuation Committee",
    )

    db.commit()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Duplicate Valuation Member",
        joined_on=date(2026, 1, 1),
    )

    add_rate(
        db,
        committee.id,
        amount=10000,
    )

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 8, 1),
        reference="DUPLICATE-VALUATION-TEST",
    )

    db.commit()

    good = add_member_good(
        db,
        member_id=member.id,
        name="Duplicate Valuation Laptop",
        purchase_date=date(2026, 8, 1),
        purchase_price=10000,
    )

    db.commit()

    update_member_good_value(
        db,
        good_id=good.id,
        valuation_date=date(2026, 8, 10),
        new_value=12000,
    )
    db.commit()

    try:
        update_member_good_value(
            db,
            good_id=good.id,
            valuation_date=date(2026, 8, 10),
            new_value=9000,
        )
    except Exception as exc:
        assert str(exc) == (
            "A member good valuation already exists for this date."
        )
    else:
        raise AssertionError(
            "Expected duplicate valuation date to be rejected."
        )

    db.refresh(good)

    assert good.current_value == 12000

    valuations = get_good_valuations(
        db,
        good_id=good.id,
    )

    assert len(valuations) == 2
    assert valuations[0].valuation_date == date(2026, 8, 1)
    assert valuations[0].value == 10000
    assert valuations[1].valuation_date == date(2026, 8, 10)
    assert valuations[1].value == 12000


def test_member_good_purchase_uses_qarz_e_hasana_for_member_shortfall(db):
    from app.models import MemberDue

    committee = create_committee(
        db,
        name="Good Qarz Committee",
    )

    db.commit()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Qarz Good Member",
        joined_on=date(2026, 1, 1),
    )

    # Member has 30,000 personally available.
    add_rate(
        db,
        committee.id,
        amount=30000,
    )

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 8, 1),
        reference="GOOD-QARZ-CONTRIBUTION",
    )

    # Another member provides committee liquidity, so the
    # committee can fund the full 50,000 purchase.
    other_member = add_member(
        db,
        committee_id=committee.id,
        name="Liquidity Member",
        joined_on=date(2026, 1, 1),
    )

    record_contribution(
        db,
        member_id=other_member.id,
        contribution_date=date(2026, 8, 1),
        reference="GOOD-QARZ-LIQUIDITY",
    )

    db.commit()

    good = add_member_good(
        db,
        member_id=member.id,
        name="Qarz Laptop",
        purchase_date=date(2026, 8, 2),
        purchase_price=50000,
    )

    db.commit()

    db.refresh(member)

    assert good.current_value == 50000
    assert get_member_goods(
        db,
        member_id=member.id,
    )[0].id == good.id

    due = db.query(MemberDue).filter(
        MemberDue.member_id == member.id,
        MemberDue.due_type == "qarz_e_hasana",
    ).one()

    assert due.amount == 20000
    assert due.paid_amount == 0

    # The shortfall is represented by the member's negative
    # accounting balance and the matching Qarz-e-Hasana due.
    from app.services.member_balance import get_member_balance

    assert get_member_balance(
        db,
        member_id=member.id,
    ) == -20000

    assert cash_balance(
        db,
        committee.id,
    ) == 10000


def test_member_good_purchase_rejects_when_committee_cash_is_insufficient(db):
    from app.models import MemberGood, MemberDue
    from app.services.member_balance import get_member_balance
    from app.services.accounting import AccountingError

    committee = create_committee(
        db,
        name="Insufficient Good Cash Committee",
    )

    db.commit()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Insufficient Cash Member",
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
        reference="INSUFFICIENT-CASH-CONTRIBUTION",
    )

    db.commit()

    cash_before = cash_balance(
        db,
        committee.id,
    )
    balance_before = get_member_balance(
        db,
        member_id=member.id,
    )

    try:
        add_member_good(
            db,
            member_id=member.id,
            name="Too Expensive Laptop",
            purchase_date=date(2026, 8, 2),
            purchase_price=50000,
        )
    except AccountingError as exc:
        assert "Insufficient committee cash" in str(exc)
    else:
        raise AssertionError(
            "Expected insufficient committee cash to reject the purchase."
        )

    assert db.query(MemberGood).filter(
        MemberGood.member_id == member.id,
    ).count() == 0

    assert db.query(MemberDue).filter(
        MemberDue.member_id == member.id,
        MemberDue.due_type == "qarz_e_hasana",
    ).count() == 0

    assert cash_balance(
        db,
        committee.id,
    ) == cash_before

    assert get_member_balance(
        db,
        member_id=member.id,
    ) == balance_before


def test_member_good_qarz_payment_restores_member_balance_and_allows_settlement(db):
    from app.models import MemberDue
    from app.services.member_balance import get_member_balance
    from app.services.member_due import pay_member_due

    committee = create_committee(
        db,
        name="Good Qarz Repayment Committee",
    )

    db.commit()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Good Qarz Repayment Member",
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
        reference="GOOD-QARZ-REPAYMENT-CONTRIBUTION",
    )

    other_member = add_member(
        db,
        committee_id=committee.id,
        name="Good Qarz Repayment Liquidity",
        joined_on=date(2026, 1, 1),
    )

    record_contribution(
        db,
        member_id=other_member.id,
        contribution_date=date(2026, 8, 1),
        reference="GOOD-QARZ-REPAYMENT-LIQUIDITY",
    )

    db.commit()

    good = add_member_good(
        db,
        member_id=member.id,
        name="Qarz Repayment Laptop",
        purchase_date=date(2026, 8, 2),
        purchase_price=50000,
    )

    db.commit()

    due = db.query(MemberDue).filter(
        MemberDue.member_id == member.id,
        MemberDue.due_type == "qarz_e_hasana",
        MemberDue.reference == f"MEMBER-GOOD-{good.id}-QARZ",
    ).one()

    assert due.amount == 20000
    assert get_member_balance(
        db,
        member_id=member.id,
    ) == -20000

    # Repaying the Qarz must restore the member's accounting
    # balance without removing the member-owned Good.
    pay_member_due(
        db,
        due_id=due.id,
        amount=20000,
    )

    db.commit()

    db.refresh(due)
    db.refresh(good)

    assert due.paid_amount == 20000
    assert get_member_balance(
        db,
        member_id=member.id,
    ) == 0
    assert good.is_active is True
    assert good.current_value == 50000

    # Once the Qarz is fully repaid, settlement is allowed.
    leave_member(
        db,
        member_id=member.id,
        leaving_date=date(2026, 8, 10),
    )

    db.commit()

    settlement = db.query(MemberSettlement).filter(
        MemberSettlement.member_id == member.id
    ).one()

    assert settlement.outstanding_dues == 0
    assert settlement.contribution_balance == 0
    assert settlement.goods_value == 50000
    assert settlement.final_amount == 50000
    assert settlement.status == "pending"
