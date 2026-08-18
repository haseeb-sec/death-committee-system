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
