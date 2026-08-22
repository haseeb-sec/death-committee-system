from pydantic import BaseModel, Field

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


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class PasswordRecoveryRequest(BaseModel):
    username: str


class PasswordReset(BaseModel):
    token: str = Field(min_length=20, max_length=512)
    new_password: str = Field(min_length=12, max_length=128)
