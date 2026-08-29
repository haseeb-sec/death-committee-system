from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class MemberSettlement(Base):
    __tablename__ = "member_settlements"

    id: Mapped[int] = mapped_column(primary_key=True)

    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id"),
        nullable=False,
        unique=True,
    )

    settlement_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    contribution_balance: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    asset_share: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    goods_value: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    gross_amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    outstanding_dues: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    final_amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pending",
    )

    member: Mapped["Member"] = relationship()
