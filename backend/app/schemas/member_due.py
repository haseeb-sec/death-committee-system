from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class MemberDueCreate(BaseModel):
    amount: int = Field(gt=0)
    due_date: date
    description: str
    reference: str | None = None


class MemberDuePayment(BaseModel):
    amount: int = Field(gt=0)


class MemberDueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    committee_id: int
    member_id: int
    amount: int
    paid_amount: int
    outstanding_amount: int
    due_date: date
    description: str
    reference: str | None = None


class MemberOutstandingDuesResponse(BaseModel):
    member_id: int
    outstanding_dues: int
