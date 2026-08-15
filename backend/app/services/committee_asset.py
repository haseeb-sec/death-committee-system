from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AssetValuation, CommitteeAsset
from app.services.accounting import AccountingError


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
    Record a committee-owned asset.

    The initial current value is equal to the purchase price.
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

    valuation = AssetValuation(
        asset_id=asset.id,
        valuation_date=purchase_date,
        value=purchase_price,
    )

    db.add(valuation)
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
    Record a new current value for an asset.

    Previous valuations remain preserved.
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
