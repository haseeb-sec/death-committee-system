from datetime import date

from app.models import (
    Account,
    AccountType,
    AssetOwnership,
    AssetParticipation,
    CommitteeAsset,
    Member,
    MemberSettlement,
)
from app.services.committee import create_committee
from app.services.committee_asset import add_committee_asset
from app.services.contribution import record_contribution
from app.services.member import add_member, leave_member
from app.services.member_settlement import pay_member_settlement
from app.services.accounting import AccountingError


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


def test_member_settlement_with_asset_share(db):
    committee = create_committee(
        db,
        name="Test Committee",
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

    member_c = add_member(
        db,
        committee_id=committee.id,
        name="Member C",
        joined_on=date(2026, 1, 1),
    )

    add_rate(db, committee.id)

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

    record_contribution(
        db,
        member_id=member_c.id,
        contribution_date=date(2026, 8, 1),
        reference="AUG-C",
    )

    db.commit()

    asset = add_committee_asset(
        db,
        committee_id=committee.id,
        name="Committee Refrigerator",
        purchase_date=date(2026, 8, 2),
        purchase_price=3000,
    )

    db.commit()

    assert cash_balance(db, committee.id) == 3000

    ownerships = db.query(AssetOwnership).filter(
        AssetOwnership.asset_id == asset.id
    ).order_by(AssetOwnership.member_id).all()

    assert len(ownerships) == 3
    assert all(o.ownership_units == 1 for o in ownerships)
    assert all(o.total_units == 3 for o in ownerships)

    leave_member(
        db,
        member_id=member_a.id,
        leaving_date=date(2026, 8, 10),
    )

    db.commit()

    settlement = db.query(MemberSettlement).filter(
        MemberSettlement.member_id == member_a.id
    ).one()

    assert settlement.contribution_balance == 2000
    assert settlement.asset_share == 1000
    assert settlement.goods_value == 0
    assert settlement.outstanding_dues == 0
    assert settlement.final_amount == 3000
    assert settlement.status == "pending"

    current_ownerships = db.query(AssetOwnership).filter(
        AssetOwnership.asset_id == asset.id
    ).order_by(AssetOwnership.member_id).all()

    departing = next(
        o for o in current_ownerships
        if o.member_id == member_a.id
    )

    remaining = [
        o for o in current_ownerships
        if o.member_id != member_a.id
    ]

    assert departing.ownership_units == 0
    assert departing.total_units == 2

    assert len(remaining) == 2
    assert all(o.ownership_units == 1 for o in remaining)
    assert all(o.total_units == 2 for o in remaining)

    historical = db.query(AssetParticipation).filter(
        AssetParticipation.asset_id == asset.id
    ).order_by(AssetParticipation.member_id).all()

    assert len(historical) == 3
    assert all(p.ownership_units == 1 for p in historical)
    assert all(p.total_units == 3 for p in historical)

    assert cash_balance(db, committee.id) == 3000

    pay_member_settlement(
        db,
        settlement_id=settlement.id,
    )

    db.commit()

    settlement = db.get(MemberSettlement, settlement.id)

    assert settlement.status == "paid"

    assert cash_balance(db, committee.id) == 0

    member_account = db.query(Account).filter(
        Account.member_id == member_a.id,
        Account.account_type == AccountType.MEMBER,
    ).one()

    member_balance = -sum(
        line.amount
        for line in member_account.journal_lines
    )

    assert member_balance == 0
