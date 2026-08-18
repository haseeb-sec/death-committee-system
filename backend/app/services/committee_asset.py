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
    JournalLine,
    Member,
)
from app.services.accounting import (
    AccountingError,
    create_journal_entry,
)


def _get_committee_cash_account(
    db: Session,
    *,
    committee_id: int,
) -> Account:
    cash_account = db.scalars(
        select(Account).where(
            Account.account_type == AccountType.CASH,
            Account.committee_id == committee_id,
            Account.member_id.is_(None),
        )
    ).first()

    if cash_account is None:
        raise AccountingError(
            f"Committee cash account not found: {committee_id}"
        )

    return cash_account


def _get_committee_cash_balance(
    db: Session,
    *,
    cash_account_id: int,
) -> int:
    cash_lines = db.scalars(
        select(JournalLine).where(
            JournalLine.account_id == cash_account_id,
        )
    ).all()

    return sum(line.amount for line in cash_lines)


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
    Record one committee asset purchase.

    Locked business rules:

    - Committee must exist and be active.
    - Asset name cannot be empty.
    - Purchase price must be greater than zero.
    - Committee must have active members on the purchase date.
    - Committee must have sufficient actual cash.
    - Asset purchase uses double-entry accounting:
          Asset account  +purchase_price
          Cash account   -purchase_price
    - Asset ownership is initially divided equally among
      members participating on the purchase date.
    - Historical participation is preserved.
    - Current ownership is stored separately.
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

    cash_account = _get_committee_cash_account(
        db,
        committee_id=committee_id,
    )

    cash_balance = _get_committee_cash_balance(
        db,
        cash_account_id=cash_account.id,
    )

    if cash_balance < purchase_price:
        raise AccountingError(
            "Insufficient committee cash. "
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

    valuation = AssetValuation(
        asset_id=asset.id,
        valuation_date=purchase_date,
        value=purchase_price,
    )

    db.add(valuation)

    total_members = len(members)

    for member in members:
        db.add(
            AssetParticipation(
                asset_id=asset.id,
                member_id=member.id,
                ownership_units=1,
                total_units=total_members,
            )
        )

        db.add(
            AssetOwnership(
                asset_id=asset.id,
                member_id=member.id,
                ownership_units=1,
                total_units=total_members,
            )
        )

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
    Record a new asset valuation.

    Valuation changes the asset's current value only.
    It does not create a cash transaction.
    Previous valuation records remain unchanged.
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
    Return complete valuation history for an asset.
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

    Historical participation is never changed when
    current ownership changes.
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
