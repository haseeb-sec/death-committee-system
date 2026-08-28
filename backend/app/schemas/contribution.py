from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class ContributionRateCreate(BaseModel):
    amount: int = Field(gt=0)
    effective_from: date


class ContributionRateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    committee_id: int
    amount: int
    effective_from: date


class ContributionCreate(BaseModel):
    contribution_date: date
    reference: str | None = None


class ContributionResponse(BaseModel):
    journal_entry_id: int
    member_id: int
    contribution_date: date
    reference: str | None = None
    description: str


class ContributionHistoryEntry(BaseModel):
    journal_entry_id: int
    member_id: int
    contribution_date: date
    amount: int
    reference: str | None = None
    description: str


class ContributionTotalResponse(BaseModel):
    member_id: int
    total_contributed: int


class MonthlyContributionStatusEntry(BaseModel):
    member_id: int
    member_name: str
    year: int
    month: int
    expected_amount: int
    paid_amount: int
    status: str
