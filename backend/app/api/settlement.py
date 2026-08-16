from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.services.accounting import AccountingError
from app.services.member_settlement import (
    pay_member_settlement,
    settle_member,
)


router = APIRouter(
    prefix="/members",
    tags=["Settlements"],
)


class SettlementCreate(BaseModel):
    settlement_date: date


@router.post("/{member_id}/settlement")
def create_member_settlement(
    member_id: int,
    data: SettlementCreate,
    db: Session = Depends(get_db),
):
    try:
        settlement = settle_member(
            db,
            member_id=member_id,
            settlement_date=data.settlement_date,
        )

        db.commit()
        db.refresh(settlement)

        return {
            "id": settlement.id,
            "member_id": settlement.member_id,
            "settlement_date": settlement.settlement_date,
            "contribution_balance": settlement.contribution_balance,
            "asset_share": settlement.asset_share,
            "goods_value": settlement.goods_value,
            "outstanding_dues": settlement.outstanding_dues,
            "gross_amount": settlement.gross_amount,
            "final_amount": settlement.final_amount,
            "status": settlement.status,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.post("/settlement/{settlement_id}/pay")
def pay_member_settlement_api(
    settlement_id: int,
    db: Session = Depends(get_db),
):
    try:
        settlement = pay_member_settlement(
            db,
            settlement_id=settlement_id,
        )

        db.commit()
        db.refresh(settlement)

        return {
            "id": settlement.id,
            "member_id": settlement.member_id,
            "settlement_date": settlement.settlement_date,
            "contribution_balance": settlement.contribution_balance,
            "asset_share": settlement.asset_share,
            "goods_value": settlement.goods_value,
            "outstanding_dues": settlement.outstanding_dues,
            "gross_amount": settlement.gross_amount,
            "final_amount": settlement.final_amount,
            "status": settlement.status,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
