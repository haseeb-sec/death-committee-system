from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Member(Base):
    __tablename__ = "members"

    __table_args__ = (
        UniqueConstraint("user_id", name="uq_members_user_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    committee_id: Mapped[int] = mapped_column(
        ForeignKey("committees.id"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    joined_on: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    left_on: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    user: Mapped["User | None"] = relationship(
        back_populates="member",
        uselist=False,
    )

    committee: Mapped["Committee"] = relationship(
        back_populates="members",
    )

    account: Mapped["Account | None"] = relationship(
        back_populates="member",
        uselist=False,
    )