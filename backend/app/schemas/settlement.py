from datetime import date

from pydantic import BaseModel


class SettlementCreate(BaseModel):
    settlement_date: date


class SettlementResponse(BaseModel):
    id: int
    member_id: int
    settlement_date: date
    contribution_balance: int
    asset_share: int
    goods_value: int
    outstanding_dues: int
    gross_amount: int
    final_amount: int
    status: str


class SettlementPreviewResponse(BaseModel):
    member_id: int
    contribution_balance: int
    asset_share: int
    goods_value: int
    outstanding_dues: int
    gross_amount: int
    final_amount: int
