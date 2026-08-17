from datetime import date

from sqlalchemy import select

from app.models import (
    Account,
    ContributionRate,
    AccountType,
    DeathSupport,
    JournalEntry,
    JournalLine,
    Member,
    MemberSettlement,
)
from app.services.accounting import create_journal_entry
from app.services.committee import create_committee
from app.services.contribution import record_contribution
from app.services.death_support import record_death_support
from app.services.member import add_member
from app.services.member_balance import get_member_balance
from app.services.member_settlement import (
    get_member_settlement,
    pay_member_settlement,
    settle_member,
)


def test_death_support_settlement_financial_integrity(db):
    committee = create_committee(
        db,
        name="Financial Integrity Committee",
    )
    db.flush()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Integrity Test Member",
        joined_on=date(2026, 8, 17),
    )
    db.flush()

    rate = ContributionRate(
        committee_id=committee.id,
        amount=70000,
        effective_from=date(2026, 8, 17),
    )
    db.add(rate)
    db.flush()

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 8, 17),
        reference="INTEGRITY-CONTRIBUTION",
    )
    db.flush()

    cash_account = db.scalars(
        select(Account).where(
            Account.committee_id == committee.id,
            Account.account_type == AccountType.CASH,
            Account.member_id.is_(None),
        )
    ).one()

    assert sum(
        line.amount
        for line in cash_account.journal_lines
    ) == 70000

    record_death_support(
        db,
        member_id=member.id,
        beneficiary_name="Integrity Beneficiary",
        amount=20000,
        support_date=date(2026, 8, 17),
        reference="INTEGRITY-DEATH",
    )
    db.flush()

    assert member.is_active is False
    assert member.left_on == date(2026, 8, 17)

    assert get_member_balance(
        db,
        member_id=member.id,
    ) == 50000

    settlement = get_member_settlement(
        db,
        member_id=member.id,
    )

    assert settlement["contribution_balance"] == 50000
    assert settlement["asset_share"] == 0
    assert settlement["goods_value"] == 0
    assert settlement["outstanding_dues"] == 0
    assert settlement["gross_amount"] == 50000
    assert settlement["final_amount"] == 50000

    record = settle_member(
        db,
        member_id=member.id,
        settlement_date=date(2026, 8, 17),
    )
    db.flush()

    assert record.status == "pending"
    assert record.final_amount == 50000

    pay_member_settlement(
        db,
        settlement_id=record.id,
    )
    db.flush()

    db.refresh(record)

    assert record.status == "paid"
    assert get_member_balance(
        db,
        member_id=member.id,
    ) == 0

    cash_balance = sum(
        line.amount
        for line in db.scalars(
            select(JournalLine).where(
                JournalLine.account_id == cash_account.id,
            )
        ).all()
    )

    assert cash_balance == 0

    member_account = member.account

    member_lines = db.scalars(
        select(JournalLine).where(
            JournalLine.account_id == member_account.id,
        )
    ).all()

    assert sum(line.amount for line in member_lines) == 0

    support = db.scalars(
        select(DeathSupport).where(
            DeathSupport.member_id == member.id,
        )
    ).one()

    assert support.amount == 20000

    settlement_record = db.scalars(
        select(MemberSettlement).where(
            MemberSettlement.member_id == member.id,
        )
    ).one()

    assert settlement_record.final_amount == 50000
    assert settlement_record.status == "paid"

    entries = db.scalars(
        select(JournalEntry)
        .order_by(JournalEntry.id.asc())
    ).all()

    for entry in entries:
        total = sum(
            line.amount
            for line in entry.lines
        )
        assert total == 0, (
            f"Journal entry {entry.id} is unbalanced: {total}"
        )


def test_asset_exit_settlement_preserves_historical_participation(db):
    from app.models import AssetOwnership, AssetParticipation, CommitteeAsset, ContributionRate
    from app.services.committee_asset import add_committee_asset, update_asset_value, update_asset_value
    from app.services.member_settlement import get_member_settlement

    committee = create_committee(
        db,
        name="Asset Exit Integrity Committee",
    )
    db.flush()

    rate = ContributionRate(
        committee_id=committee.id,
        amount=70000,
        effective_from=date(2026, 8, 17),
    )
    db.add(rate)
    db.flush()

    members = []

    for name in ("Asset Member A", "Asset Member B", "Asset Member C"):
        member = add_member(
            db,
            committee_id=committee.id,
            name=name,
            joined_on=date(2026, 8, 17),
        )
        db.flush()

        record_contribution(
            db,
            member_id=member.id,
            contribution_date=date(2026, 8, 17),
            reference=f"ASSET-INTEGRITY-{name[-1]}",
        )
        db.flush()

        members.append(member)

    asset = add_committee_asset(
        db,
        committee_id=committee.id,
        name="Integrity Committee Property",
        purchase_date=date(2026, 8, 17),
        purchase_price=90000,
    )
    db.flush()

    update_asset_value(
        db,
        asset_id=asset.id,
        valuation_date=date(2026, 8, 17),
        new_value=120000,
    )
    db.flush()

    participations = db.scalars(
        select(AssetParticipation)
        .where(
            AssetParticipation.asset_id == asset.id,
        )
        .order_by(AssetParticipation.member_id.asc())
    ).all()

    assert len(participations) == 3

    for participation in participations:
        assert participation.ownership_units == 1
        assert participation.total_units == 3

    ownerships = db.scalars(
        select(AssetOwnership)
        .where(
            AssetOwnership.asset_id == asset.id,
        )
        .order_by(AssetOwnership.member_id.asc())
    ).all()

    assert len(ownerships) == 3

    for ownership in ownerships:
        assert ownership.ownership_units == 1
        assert ownership.total_units == 3

    settlement_preview = get_member_settlement(
        db,
        member_id=members[0].id,
    )

    assert settlement_preview["contribution_balance"] == 70000
    assert settlement_preview["asset_share"] == 40000
    assert settlement_preview["goods_value"] == 0
    assert settlement_preview["outstanding_dues"] == 0
    assert settlement_preview["gross_amount"] == 110000
    assert settlement_preview["final_amount"] == 110000

    settlement = settle_member(
        db,
        member_id=members[0].id,
        settlement_date=date(2026, 8, 17),
    )
    db.flush()

    assert settlement.asset_share == 40000
    assert settlement.final_amount == 110000
    assert settlement.status == "pending"

    departing_ownership = db.scalars(
        select(AssetOwnership).where(
            AssetOwnership.asset_id == asset.id,
            AssetOwnership.member_id == members[0].id,
        )
    ).one()

    assert departing_ownership.ownership_units == 0
    assert departing_ownership.total_units == 2

    remaining_ownerships = db.scalars(
        select(AssetOwnership).where(
            AssetOwnership.asset_id == asset.id,
            AssetOwnership.member_id.in_(
                [members[1].id, members[2].id]
            ),
        )
        .order_by(AssetOwnership.member_id.asc())
    ).all()

    assert len(remaining_ownerships) == 2

    for ownership in remaining_ownerships:
        assert ownership.ownership_units == 1
        assert ownership.total_units == 2

    historical = db.scalars(
        select(AssetParticipation).where(
            AssetParticipation.asset_id == asset.id,
        )
        .order_by(AssetParticipation.member_id.asc())
    ).all()

    assert len(historical) == 3

    for participation in historical:
        assert participation.ownership_units == 1
        assert participation.total_units == 3

    pay_member_settlement(
        db,
        settlement_id=settlement.id,
    )
    db.flush()

    db.refresh(settlement)

    assert settlement.status == "paid"
    assert get_member_balance(
        db,
        member_id=members[0].id,
    ) == 0

    active_ownerships = db.scalars(
        select(AssetOwnership).where(
            AssetOwnership.asset_id == asset.id,
            AssetOwnership.ownership_units > 0,
        )
    ).all()

    total_units = sum(
        ownership.ownership_units
        for ownership in active_ownerships
    )

    assert total_units == 2

    for ownership in active_ownerships:
        assert ownership.total_units == 2

    asset = db.get(CommitteeAsset, asset.id)

    assert asset.current_value == 120000

    asset_account = db.scalars(
        select(Account).where(
            Account.committee_id == committee.id,
            Account.account_type == AccountType.ASSET,
            Account.name == f"Asset: {asset.name}",
        )
    ).one()

    asset_account_balance = sum(
        line.amount
        for line in db.scalars(
            select(JournalLine).where(
                JournalLine.account_id == asset_account.id,
            )
        ).all()
    )

    assert asset_account_balance == 90000

    entries = db.scalars(
        select(JournalEntry)
        .order_by(JournalEntry.id.asc())
    ).all()

    for entry in entries:
        total = sum(
            line.amount
            for line in entry.lines
        )
        assert total == 0, (
            f"Journal entry {entry.id} is unbalanced: {total}"
        )


def test_combined_settlement_components_reconcile(db):
    from app.models import ContributionRate
    from app.services.committee_asset import (
        add_committee_asset,
        update_asset_value,
    )
    from app.services.member_due import create_member_due, get_outstanding_dues, pay_member_due
    from app.services.member_good import add_member_good

    committee = create_committee(
        db,
        name="Combined Settlement Integrity Committee",
    )
    db.flush()

    rate = ContributionRate(
        committee_id=committee.id,
        amount=70000,
        effective_from=date(2026, 8, 17),
    )
    db.add(rate)
    db.flush()

    member_a = add_member(
        db,
        committee_id=committee.id,
        name="Combined Member A",
        joined_on=date(2026, 8, 17),
    )
    member_b = add_member(
        db,
        committee_id=committee.id,
        name="Combined Member B",
        joined_on=date(2026, 8, 17),
    )
    db.flush()

    for member, ref in (
        (member_a, "COMBINED-A"),
        (member_b, "COMBINED-B"),
    ):
        record_contribution(
            db,
            member_id=member.id,
            contribution_date=date(2026, 8, 17),
            reference=ref,
        )
        db.flush()

    asset = add_committee_asset(
        db,
        committee_id=committee.id,
        name="Combined Settlement Asset",
        purchase_date=date(2026, 8, 17),
        purchase_price=40000,
    )
    db.flush()

    update_asset_value(
        db,
        asset_id=asset.id,
        valuation_date=date(2026, 8, 17),
        new_value=60000,
    )
    db.flush()

    good = add_member_good(
        db,
        member_id=member_a.id,
        name="Combined Member Good",
        purchase_date=date(2026, 8, 17),
        purchase_price=10000,
    )
    db.flush()

    due = create_member_due(
        db,
        member_id=member_a.id,
        amount=15000,
        due_date=date(2026, 8, 17),
        description="Combined settlement due",
        reference="COMBINED-DUE",
    )
    db.flush()

    settlement_preview = get_member_settlement(
        db,
        member_id=member_a.id,
    )

    # 70,000 contribution
    # -10,000 converted into a member-owned good
    # =60,000 remaining refundable cash
    # +30,000 asset share
    # +10,000 goods value
    # -15,000 outstanding due
    # =85,000 settlement before the due is paid
    assert settlement_preview["contribution_balance"] == 60000
    assert settlement_preview["asset_share"] == 30000
    assert settlement_preview["goods_value"] == 10000
    assert settlement_preview["outstanding_dues"] == 15000
    assert settlement_preview["gross_amount"] == 100000
    assert settlement_preview["final_amount"] == 85000

    try:
        settle_member(
            db,
            member_id=member_a.id,
            settlement_date=date(2026, 8, 17),
        )
    except Exception as exc:
        assert "outstanding dues" in str(exc).lower()
    else:
        raise AssertionError(
            "Settlement should not be created with outstanding dues."
        )

    pay_member_due(
        db,
        due_id=due.id,
        amount=15000,
    )
    db.flush()

    assert get_outstanding_dues(
        db,
        member_id=member_a.id,
    ) == 0

    settlement = settle_member(
        db,
        member_id=member_a.id,
        settlement_date=date(2026, 8, 17),
    )
    db.flush()

    assert settlement.contribution_balance == 60000
    assert settlement.asset_share == 30000
    assert settlement.goods_value == 10000
    assert settlement.outstanding_dues == 0
    assert settlement.gross_amount == 100000
    assert settlement.final_amount == 100000

    pay_member_settlement(
        db,
        settlement_id=settlement.id,
    )
    db.flush()

    db.refresh(settlement)

    assert settlement.status == "paid"
    assert get_member_balance(
        db,
        member_id=member_a.id,
    ) == 0

    assert good.is_active is False

    entries = db.scalars(
        select(JournalEntry)
        .order_by(JournalEntry.id.asc())
    ).all()

    for entry in entries:
        total = sum(
            line.amount
            for line in entry.lines
        )
        assert total == 0, (
            f"Journal entry {entry.id} is unbalanced: {total}"
        )
