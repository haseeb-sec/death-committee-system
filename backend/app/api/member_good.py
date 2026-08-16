from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.services.accounting import AccountingError
from app.services.member_good import (
    add_member_good,
    get_member_goods,
    get_member_goods_total,
    get_good_valuations,
    update_member_good_value,
)


router = APIRouter(
    prefix="/members",
    tags=["Member Goods"],
)


class MemberGoodCreate(BaseModel):
    name: str
    purchase_date: date
    purchase_price: int = Field(gt=0)
    description: str | None = None


class MemberGoodValueUpdate(BaseModel):
    valuation_date: date
    new_value: int = Field(ge=0)


@router.post("/{member_id}/goods")
def create_member_good(
    member_id: int,
    data: MemberGoodCreate,
    db: Session = Depends(get_db),
):
    try:
        good = add_member_good(
            db,
            member_id=member_id,
            name=data.name,
            purchase_date=data.purchase_date,
            purchase_price=data.purchase_price,
            description=data.description,
        )

        db.commit()
        db.refresh(good)

        return {
            "id": good.id,
            "member_id": good.member_id,
            "name": good.name,
            "purchase_date": good.purchase_date,
            "purchase_price": good.purchase_price,
            "current_value": good.current_value,
            "description": good.description,
            "is_active": good.is_active,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.get("/{member_id}/goods")
def list_member_goods(
    member_id: int,
    db: Session = Depends(get_db),
):
    try:
        goods = get_member_goods(
            db,
            member_id=member_id,
        )

        return [
            {
                "id": good.id,
                "member_id": good.member_id,
                "name": good.name,
                "purchase_date": good.purchase_date,
                "purchase_price": good.purchase_price,
                "current_value": good.current_value,
                "description": good.description,
                "is_active": good.is_active,
            }
            for good in goods
        ]

    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@router.get("/{member_id}/goods/total")
def member_goods_total(
    member_id: int,
    db: Session = Depends(get_db),
):
    try:
        total = get_member_goods_total(
            db,
            member_id=member_id,
        )

        return {
            "member_id": member_id,
            "total_goods_value": total,
        }

    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@router.get("/{member_id}/goods/{good_id}/valuations")
def good_valuations(
    member_id: int,
    good_id: int,
    db: Session = Depends(get_db),
):
    try:
        goods = get_member_goods(
            db,
            member_id=member_id,
        )

        good = next(
            (item for item in goods if item.id == good_id),
            None,
        )

        if good is None:
            raise AccountingError(
                f"Member good not found: {good_id}"
            )

        valuations = get_good_valuations(
            db,
            good_id=good_id,
        )

        return [
            {
                "id": valuation.id,
                "good_id": valuation.good_id,
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


@router.patch("/goods/{good_id}/value")
def update_good_value(
    good_id: int,
    data: MemberGoodValueUpdate,
    db: Session = Depends(get_db),
):
    try:
        good = update_member_good_value(
            db,
            good_id=good_id,
            valuation_date=data.valuation_date,
            new_value=data.new_value,
        )

        db.commit()
        db.refresh(good)

        return {
            "id": good.id,
            "member_id": good.member_id,
            "name": good.name,
            "purchase_date": good.purchase_date,
            "purchase_price": good.purchase_price,
            "current_value": good.current_value,
            "description": good.description,
            "is_active": good.is_active,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
