from datetime import date

from pydantic import BaseModel


class MemberCreate(BaseModel):
    committee_id: int
    name: str
    joined_on: date


class MemberLeave(BaseModel):
    leaving_date: date


class MemberResponse(BaseModel):
    id: int
    committee_id: int
    name: str
    joined_on: date
    left_on: date | None = None
    is_active: bool


class MemberStatementResponse(BaseModel):
    date: date
    description: str
    reference: str | None = None
    amount: int


class MemberDeathSupportSummary(BaseModel):
    id: int
    beneficiary_name: str
    amount: int
    support_date: date
    reference: str | None = None


class MemberSettlementSummary(BaseModel):
    id: int
    settlement_date: date
    contribution_balance: int
    asset_share: int
    goods_value: int
    gross_amount: int
    outstanding_dues: int
    final_amount: int
    status: str


class MemberFinancialSummaryResponse(BaseModel):
    member_id: int
    member_name: str
    joined_on: date
    left_on: date | None = None
    is_active: bool

    contribution_count: int
    total_contributions: int

    contribution_balance: int
    asset_share: int
    goods_value: int

    ordinary_dues: int
    qarz_e_hasana_dues: int
    outstanding_dues: int

    current_gross_value: int
    current_final_value: int

    death_support: MemberDeathSupportSummary | None = None
    settlement: MemberSettlementSummary | None = None
