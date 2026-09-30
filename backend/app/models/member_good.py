from datetime import date

from sqlalchemy import CheckConstraint, Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class MemberGood(Base):
    __tablename__ = "member_goods"

    __table_args__ = (
        CheckConstraint(
            "purchase_price >= 0",
            name="ck_member_goods_purchase_price_nonnegative",
        ),
        CheckConstraint(
            "current_value >= 0",
            name="ck_member_goods_current_value_nonnegative",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    purchase_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    purchase_price: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    current_value: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )

    member: Mapped["Member"] = relationship()
