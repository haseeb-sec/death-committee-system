from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class MemberGoodValuation(Base):
    __tablename__ = "member_good_valuations"

    __table_args__ = (
        UniqueConstraint(
            "good_id",
            "valuation_date",
            name="uq_member_good_valuations_good_date",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    good_id: Mapped[int] = mapped_column(
        ForeignKey("member_goods.id"),
        nullable=False,
    )

    valuation_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    value: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    good: Mapped["MemberGood"] = relationship()
