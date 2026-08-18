from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class MemberGoodCreate(BaseModel):
    name: str
    purchase_date: date
    purchase_price: int = Field(gt=0)
    description: str | None = None


class MemberGoodValueUpdate(BaseModel):
    valuation_date: date
    new_value: int = Field(ge=0)


class MemberGoodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    member_id: int
    name: str
    purchase_date: date
    purchase_price: int
    current_value: int
    description: str | None = None
    is_active: bool


class MemberGoodValuationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    good_id: int
    valuation_date: date
    value: int


class MemberGoodsTotalResponse(BaseModel):
    member_id: int
    total_goods_value: int
