from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Account,
    AccountType,
    AssetParticipation,
    AssetOwnership,
    AssetValuation,
    Committee,
    CommitteeAsset,
    Member,
)
from app.services.accounting import (
    AccountingError,
    create_journal_entry,
)


def add_committee_asset(
    db: Session,
    *,
    committee_id: int,
    name: str,
    purchase_date: date,
    purchase_price: int,
    description: str | None = None,
) -> CommitteeAsset:
    """
    Record a committee asset purchase.

    Business rules:

    - The committee must exist and be active.
    - The asset name cannot be empty.
    - The purchase price must be greater than zero.
    - The committee must have active members on the purchase date.
    - The committee must have enough cash to purchase the asset.
    - The purchase is recorded through double-entry accounting:
          Asset account  +purchase_price
          Cash account   -purchase_price
    - Equal current ownership is assigned to all active members
      participating at the purchase date.
    - AssetParticipation preserves the historical participation.
    - AssetOwnership represents the current ownership.
    """

    name = name.strip()

    if not name:
        raise AccountingError(
            "Asset name cannot be empty."
        )

    if purchase_price <= 0:
        raise AccountingError(
            "Purchase price must be greater than zero."
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

    members = db.scalars(
        select(Member)
        .where(
            Member.committee_id == committee_id,
            Member.is_active.is_(True),
            Member.joined_on <= purchase_date,
        )
        .order_by(Member.id.asc())
    ).all()

    if not members:
        raise AccountingError(
            "Committee must have active members to purchase an asset."
        )

    cash_account = db.scalars(
        select(Account)
        .where(
            Account.account_type == AccountType.CASH,
            Account.committee_id == committee_id,
            Account.member_id.is_(None),
        )
    ).first()

    if cash_account is None:
        raise AccountingError(
            "Committee cash account not found."
        )

    cash_balance = sum(
        line.amount
        for line in cash_account.journal_lines
    )

    if cash_balance < purchase_price:
        raise AccountingError(
            f"Insufficient committee cash. "
            f"Required: {purchase_price}, "
            f"available: {cash_balance}"
        )

    asset = CommitteeAsset(
        committee_id=committee_id,
        name=name,
        purchase_date=purchase_date,
        purchase_price=purchase_price,
        current_value=purchase_price,
        description=description,
        is_active=True,
    )

    db.add(asset)
    db.flush()

    asset_account = Account(
        name=f"Asset: {name}",
        account_type=AccountType.ASSET,
        committee_id=committee_id,
        member_id=None,
    )

    db.add(asset_account)
    db.flush()

    valuation = AssetValuation(
        asset_id=asset.id,
        valuation_date=purchase_date,
        value=purchase_price,
    )

    db.add(valuation)

    create_journal_entry(
        db,
        description=f"Committee asset purchase: {name}",
        entry_date=datetime.combine(
            purchase_date,
            datetime.min.time(),
        ),
        lines=[
            (asset_account.id, purchase_price),
            (cash_account.id, -purchase_price),
        ],
    )

    total_members = len(members)

    for member in members:
        participation = AssetParticipation(
            asset_id=asset.id,
            member_id=member.id,
            ownership_units=1,
            total_units=total_members,
        )

        db.add(participation)

        ownership = AssetOwnership(
            asset_id=asset.id,
            member_id=member.id,
            ownership_units=1,
            total_units=total_members,
        )

        db.add(ownership)

    db.flush()

    return asset


def update_asset_value(
    db: Session,
    *,
    asset_id: int,
    valuation_date: date,
    new_value: int,
) -> CommitteeAsset:
    """
    Record a new current value while preserving
    previous valuation history.
    """

    if new_value < 0:
        raise AccountingError(
            "Asset value cannot be negative."
        )

    asset = db.get(CommitteeAsset, asset_id)

    if asset is None:
        raise AccountingError(
            f"Asset not found: {asset_id}"
        )

    if not asset.is_active:
        raise AccountingError(
            f"Asset is inactive: {asset_id}"
        )

    if valuation_date < asset.purchase_date:
        raise AccountingError(
            "Valuation date cannot be before purchase date."
        )

    valuation = AssetValuation(
        asset_id=asset.id,
        valuation_date=valuation_date,
        value=new_value,
    )

    db.add(valuation)

    asset.current_value = new_value

    db.flush()

    return asset


def get_asset_valuations(
    db: Session,
    *,
    asset_id: int,
) -> list[AssetValuation]:
    """
    Return the complete valuation history for an asset.
    """

    asset = db.get(CommitteeAsset, asset_id)

    if asset is None:
        raise AccountingError(
            f"Asset not found: {asset_id}"
        )

    return db.scalars(
        select(AssetValuation)
        .where(
            AssetValuation.asset_id == asset_id,
        )
        .order_by(
            AssetValuation.valuation_date.asc(),
            AssetValuation.id.asc(),
        )
    ).all()


def get_asset_participation(
    db: Session,
    *,
    asset_id: int,
) -> list[AssetParticipation]:
    """
    Return all members who historically participated in an asset.

    Historical participation is never changed when ownership
    later changes.
    """

    asset = db.get(CommitteeAsset, asset_id)

    if asset is None:
        raise AccountingError(
            f"Asset not found: {asset_id}"
        )

    return db.scalars(
        select(AssetParticipation)
        .where(
            AssetParticipation.asset_id == asset_id,
        )
        .order_by(
            AssetParticipation.member_id.asc(),
        )
    ).all()
