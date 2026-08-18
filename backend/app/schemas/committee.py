from pydantic import BaseModel


class CommitteeCreate(BaseModel):
    name: str


class CommitteeResponse(BaseModel):
    id: int
    name: str
    is_active: bool


class CommitteeSummaryResponse(BaseModel):
    committee_id: int
    committee_name: str
    is_active: bool
    total_contributions: int
    total_death_support: int
    cash_balance: int


class CommitteeFinancialPositionResponse(BaseModel):
    committee_id: int
    committee_name: str
    is_active: bool
    cash_balance: int
