from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.member_good import (
    MemberGoodCreate,
    MemberGoodResponse,
    MemberGoodValuationResponse,
    MemberGoodValueUpdate,
    MemberGoodsTotalResponse,
)

from app.api.dependencies import get_db
from app.api.permissions import require_admin, require_authenticated
from app.services.accounting import AccountingError
from app.services.member_good import (
    add_member_good,
    get_member_goods,
    get_member_goods_total,
    get_good_valuations,
    update_member_good_value,
)
from app.services.audit import record_audit


router = APIRouter(
    prefix="/members",
    tags=["Member Goods"],
)


@router.post(
    "/{member_id}/goods",
    response_model=MemberGoodResponse,
)
def create_member_good(
    member_id: int,
    data: MemberGoodCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
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

        record_audit(
            db,
            user_id=current_user.id,
            action="create",
            entity_type="member_good",
            entity_id=good.id,
            description=(
                f"Created member good '{good.name}' "
                f"for member {member_id}"
            ),
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="update_value",
            entity_type="member_good",
            entity_id=good.id,
            description=(
                f"Updated value of member good '{good.name}' "
                f"to {good.current_value}"
            ),
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


@router.get(
    "/{member_id}/goods",
    response_model=list[MemberGoodResponse],
)
def list_member_goods(
    member_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
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


@router.get(
    "/{member_id}/goods/total",
    response_model=MemberGoodsTotalResponse,
)
def member_goods_total(
    member_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
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


@router.get(
    "/{member_id}/goods/{good_id}/valuations",
    response_model=list[MemberGoodValuationResponse],
)
def good_valuations(
    member_id: int,
    good_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
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


@router.patch(
    "/goods/{good_id}/value",
    response_model=MemberGoodResponse,
)
def update_good_value(
    good_id: int,
    data: MemberGoodValueUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    try:
        good = update_member_good_value(
            db,
            good_id=good_id,
            valuation_date=data.valuation_date,
            new_value=data.new_value,
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="update_value",
            entity_type="member_good",
            entity_id=good.id,
            description=(
                f"Updated value of member good '{good.name}' "
                f"to {good.current_value}"
            ),
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
