from enum import Enum

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class AccountType(str, Enum):
    CASH = "cash"
    MEMBER = "member"
    ASSET = "asset"
    EXPENSE = "expense"
    RECOVERY = "recovery"


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    account_type: Mapped[AccountType] = mapped_column(
        SQLEnum(AccountType),
        nullable=False,
    )

    member_id: Mapped[int | None] = mapped_column(
        ForeignKey("members.id"),
        nullable=True,
        unique=True,
    )

    member: Mapped["Member | None"] = relationship(
        back_populates="account",
    )