
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.committee_asset import (
    AssetParticipationResponse,
    AssetValuationResponse,
    AssetValueUpdate,
    CommitteeAssetCreate,
    CommitteeAssetResponse,
)
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.api.permissions import require_admin, require_authenticated
from app.services.accounting import AccountingError
from app.services.committee_asset import (
    add_committee_asset,
    get_asset_valuations,
    get_asset_participation,
    update_asset_value,
)
from app.services.audit import record_audit


router = APIRouter(
    prefix="/committees",
    tags=["Committee Assets"],
)


@router.post(
    "/{committee_id}/assets",
    response_model=CommitteeAssetResponse,
)
def create_committee_asset(
    committee_id: int,
    data: CommitteeAssetCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    try:
        asset = add_committee_asset(
            db,
            committee_id=committee_id,
            name=data.name,
            purchase_date=data.purchase_date,
            purchase_price=data.purchase_value,
            description=data.description,
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="create",
            entity_type="committee_asset",
            entity_id=asset.id,
            description=(
                f"Created committee asset '{asset.name}' "
                f"for committee {committee_id}"
            ),
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="update_value",
            entity_type="committee_asset",
            entity_id=asset.id,
            description=(
                f"Updated value of committee asset '{asset.name}' "
                f"to {asset.current_value}"
            ),
        )

        db.commit()
        db.refresh(asset)

        return {
            "id": asset.id,
            "committee_id": asset.committee_id,
            "name": asset.name,
            "purchase_date": asset.purchase_date,
            "purchase_value": asset.purchase_price,
            "current_value": asset.current_value,
            "description": asset.description,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.patch(
    "/assets/{asset_id}/value",
    response_model=CommitteeAssetResponse,
)
def update_committee_asset_value(
    asset_id: int,
    data: AssetValueUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    try:
        asset = update_asset_value(
            db,
            asset_id=asset_id,
            valuation_date=data.valuation_date,
            new_value=data.new_value,
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="update_value",
            entity_type="committee_asset",
            entity_id=asset.id,
            description=(
                f"Updated value of committee asset {asset.name} "
                f"to {asset.current_value}"
            ),
        )

        db.commit()
        db.refresh(asset)

        return {
            "id": asset.id,
            "committee_id": asset.committee_id,
            "name": asset.name,
            "purchase_date": asset.purchase_date,
            "purchase_value": asset.purchase_price,
            "current_value": asset.current_value,
            "description": asset.description,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.get(
    "/assets/{asset_id}/valuations",
    response_model=list[AssetValuationResponse],
)
def committee_asset_valuations(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        valuations = get_asset_valuations(
            db,
            asset_id=asset_id,
        )

        return [
            {
                "id": valuation.id,
                "asset_id": valuation.asset_id,
                "valuation_date": valuation.valuation_date,
                "value": valuation.value,
            }
            for valuation in valuations
        ]

    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@router.get(
    "/assets/{asset_id}/participation",
    response_model=list[AssetParticipationResponse],
)
def committee_asset_participation(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        participation = get_asset_participation(
            db,
            asset_id=asset_id,
        )

        return participation

    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
