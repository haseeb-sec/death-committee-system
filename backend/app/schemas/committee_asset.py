from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class CommitteeAssetCreate(BaseModel):
    name: str
    purchase_date: date
    purchase_value: int = Field(gt=0)
    description: str | None = None


class AssetValueUpdate(BaseModel):
    valuation_date: date
    new_value: int = Field(ge=0)


class CommitteeAssetResponse(BaseModel):
    id: int
    committee_id: int
    name: str
    purchase_date: date
    purchase_value: int
    current_value: int
    description: str | None = None


class AssetValuationResponse(BaseModel):
    id: int
    asset_id: int
    valuation_date: date
    value: int


class AssetParticipationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: int
    member_id: int
    ownership_units: int
    total_units: int
