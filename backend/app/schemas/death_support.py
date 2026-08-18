from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class DeathSupportCreate(BaseModel):
    beneficiary_name: str
    amount: int = Field(gt=0)
    support_date: date
    reference: str | None = None


class DeathSupportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    committee_id: int
    member_id: int
    beneficiary_name: str
    amount: int
    member_funded_amount: int
    qarz_e_hasana_amount: int
    support_date: date
    reference: str | None = None


class DeathSupportStatusResponse(BaseModel):
    member_id: int
    death_support_recorded: bool
    support_id: int | None = None
    amount: int
    support_date: date | None = None
