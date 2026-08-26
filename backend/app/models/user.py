from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class UserRole(str, Enum):
    """
    System-level identity roles.

    SUPER_ADMIN:
        Global platform administrator.

    COMMITTEE_ADMIN:
        Administrator of explicitly assigned committees.

    MEMBER:
        Normal committee member with access to their own information.
    """
    SUPER_ADMIN = "super_admin"
    COMMITTEE_ADMIN = "committee_admin"
    MEMBER = "member"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=UserRole.MEMBER.value,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
    password_reset_token_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    member: Mapped["Member | None"] = relationship(
        back_populates="user",
        uselist=False,
    )

    password_reset_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
