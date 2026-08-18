from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.api.permissions import require_admin
from app.schemas.settlement import (
    SettlementCreate,
    SettlementResponse,
)
from app.api.permissions import require_admin
from app.services.accounting import AccountingError
from app.services.member_settlement import (
    pay_member_settlement,
    settle_member,
)
from app.services.audit import record_audit


router = APIRouter(
    prefix="/members",
    tags=["Settlements"],
)


@router.post(
    "/{member_id}/settlement",
    response_model=SettlementResponse,
)
def create_member_settlement(
    member_id: int,
    data: SettlementCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    try:
        settlement = settle_member(
            db,
            member_id=member_id,
            settlement_date=data.settlement_date,
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="create",
            entity_type="member_settlement",
            entity_id=settlement.id,
            description=(
                f"Created settlement {settlement.id} "
                f"for member {member_id}, final amount {settlement.final_amount}"
            ),
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


@router.post(
    "/settlement/{settlement_id}/pay",
    response_model=SettlementResponse,
)
def pay_member_settlement_api(
    settlement_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    try:
        settlement = pay_member_settlement(
            db,
            settlement_id=settlement_id,
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="pay",
            entity_type="member_settlement",
            entity_id=settlement.id,
            description=(
                f"Paid settlement {settlement.id} "
                f"for member {settlement.member_id}, "
                f"amount {settlement.final_amount}"
            ),
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
