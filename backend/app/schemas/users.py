from pydantic import BaseModel

from app.models import UserRole


class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRole


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool


class CommitteeAccessCreate(BaseModel):
    user_id: int


class CommitteeAccessResponse(BaseModel):
    id: int
    user_id: int
    committee_id: int
    is_active: bool
