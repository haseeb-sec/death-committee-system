from datetime import date

import pytest

from app.models import (
    Account,
    AccountType,
    AssetOwnership,
    AssetParticipation,
    CommitteeAsset,
    ContributionRate,
    Member,
    MemberGood,
    MemberSettlement,
)
from app.services.accounting import AccountingError
from app.services.asset_share import get_member_asset_share
from app.services.contribution import record_contribution
from app.services.member import add_member
from app.services.member_good import add_member_good
from app.services.member_settlement import (
    get_member_settlement,
    pay_member_settlement,
    settle_member,
)


def committee_cash(db, committee_id):
    cash_account = db.query(Account).filter(
        Account.committee_id == committee_id,
        Account.account_type == AccountType.CASH,
        Account.member_id.is_(None),
    ).first()

    assert cash_account is not None

    return sum(
        line.amount
        for line in cash_account.journal_lines
    )


def test_settlement_snapshot_is_frozen(db, member):
    """
    Once settlement is created, later changes must not
    silently change the frozen settlement amount.
    """

    before = get_member_settlement(
        db,
        member_id=member.id,
    )

    settlement = settle_member(
        db,
        member_id=member.id,
        settlement_date=date.today(),
    )

    assert settlement.final_amount == before["final_amount"]
    assert settlement.asset_share == before["asset_share"]
    assert settlement.goods_value == before["goods_value"]
    assert settlement.contribution_balance == before["contribution_balance"]


def test_settlement_cannot_be_created_twice(db, member):
    settle_member(
        db,
        member_id=member.id,
        settlement_date=date.today(),
    )

    with pytest.raises(AccountingError):
        settle_member(
            db,
            member_id=member.id,
            settlement_date=date.today(),
        )


def test_paid_settlement_cannot_be_paid_twice(db, member):
    settlement = settle_member(
        db,
        member_id=member.id,
        settlement_date=date.today(),
    )

    pay_member_settlement(
        db,
        settlement_id=settlement.id,
    )

    with pytest.raises(AccountingError):
        pay_member_settlement(
            db,
            settlement_id=settlement.id,
        )


def test_member_goods_are_closed_after_settlement_payment(
    db,
    member,
):
    rate = ContributionRate(
        committee_id=member.committee_id,
        amount=2000,
        effective_from=date(2026, 1, 1),
    )

    db.add(rate)
    db.flush()

    other_member = add_member(
        db,
        committee_id=member.committee_id,
        name="Other Member",
        joined_on=date(2026, 1, 1),
    )

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 8, 1),
        reference="INVARIANT-GOOD-A",
    )

    record_contribution(
        db,
        member_id=other_member.id,
        contribution_date=date(2026, 8, 2),
        reference="INVARIANT-GOOD-B",
    )

    good = add_member_good(
        db,
        member_id=member.id,
        name="Test Good",
        purchase_date=date.today(),
        purchase_price=100,
        description="Invariant test",
    )

    db.flush()

    settlement = settle_member(
        db,
        member_id=member.id,
        settlement_date=date.today(),
    )

    assert settlement.goods_value == 100

    pay_member_settlement(
        db,
        settlement_id=settlement.id,
    )

    db.refresh(good)

    assert good.is_active is False


def test_asset_history_survives_member_exit(
    db,
    committee,
    member,
):
    """
    Historical participation must remain historical.
    Current ownership is allowed to change.
    """

    asset = CommitteeAsset(
        committee_id=committee.id,
        name="Invariant Asset",
        purchase_date=date.today(),
        purchase_price=1000,
        current_value=1000,
        is_active=True,
    )

    db.add(asset)
    db.flush()

    participation = AssetParticipation(
        asset_id=asset.id,
        member_id=member.id,
        ownership_units=1,
        total_units=1,
    )

    ownership = AssetOwnership(
        asset_id=asset.id,
        member_id=member.id,
        ownership_units=1,
        total_units=1,
    )

    db.add(participation)
    db.add(ownership)
    db.flush()

    original_participation_id = participation.id

    settle_member(
        db,
        member_id=member.id,
        settlement_date=date.today(),
    )

    db.refresh(participation)

    assert participation.id == original_participation_id
    assert participation.member_id == member.id
    assert participation.ownership_units == 1

    db.refresh(ownership)

    assert ownership.ownership_units == 0


def test_settlement_does_not_create_money(
    db,
    member,
):
    """
    Paying a settlement must reduce committee cash.
    It must never increase total committee cash.
    """

    before_cash = committee_cash(
        db,
        member.committee_id,
    )

    settlement = settle_member(
        db,
        member_id=member.id,
        settlement_date=date.today(),
    )

    amount = settlement.final_amount

    if amount == 0:
        return

    if before_cash < amount:
        pytest.skip(
            "Fixture does not contain enough committee cash "
            "for a positive settlement."
        )

    pay_member_settlement(
        db,
        settlement_id=settlement.id,
    )

    after_cash = committee_cash(
        db,
        member.committee_id,
    )

    assert after_cash == before_cash - amount
