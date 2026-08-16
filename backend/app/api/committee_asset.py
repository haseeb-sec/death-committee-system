from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.services.accounting import AccountingError
from app.services.committee_asset import (
    add_committee_asset,
    get_asset_valuations,
    get_asset_participation,
    update_asset_value,
)


router = APIRouter(
    prefix="/committees",
    tags=["Committee Assets"],
)


class CommitteeAssetCreate(BaseModel):
    name: str
    purchase_date: date
    purchase_value: int = Field(gt=0)
    description: str | None = None


class AssetValueUpdate(BaseModel):
    valuation_date: date
    new_value: int = Field(ge=0)


@router.post("/{committee_id}/assets")
def create_committee_asset(
    committee_id: int,
    data: CommitteeAssetCreate,
    db: Session = Depends(get_db),
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


@router.patch("/assets/{asset_id}/value")
def update_committee_asset_value(
    asset_id: int,
    data: AssetValueUpdate,
    db: Session = Depends(get_db),
):
    try:
        asset = update_asset_value(
            db,
            asset_id=asset_id,
            valuation_date=data.valuation_date,
            new_value=data.new_value,
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


@router.get("/assets/{asset_id}/valuations")
def committee_asset_valuations(
    asset_id: int,
    db: Session = Depends(get_db),
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


@router.get("/assets/{asset_id}/participation")
def committee_asset_participation(
    asset_id: int,
    db: Session = Depends(get_db),
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
