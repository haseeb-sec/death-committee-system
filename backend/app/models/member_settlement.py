from datetime import date

from sqlalchemy import CheckConstraint, Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class MemberSettlement(Base):
    __tablename__ = "member_settlements"

    __table_args__ = (
        CheckConstraint(
            "contribution_balance >= 0",
            name="ck_member_settlements_contribution_balance_nonnegative",
        ),
        CheckConstraint(
            "asset_share >= 0",
            name="ck_member_settlements_asset_share_nonnegative",
        ),
        CheckConstraint(
            "goods_value >= 0",
            name="ck_member_settlements_goods_value_nonnegative",
        ),
        CheckConstraint(
            "gross_amount >= 0",
            name="ck_member_settlements_gross_amount_nonnegative",
        ),
        CheckConstraint(
            "outstanding_dues >= 0",
            name="ck_member_settlements_outstanding_dues_nonnegative",
        ),
    )

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
