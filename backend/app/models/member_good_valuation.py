from datetime import date

from sqlalchemy import Date, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class MemberGoodValuation(Base):
    __tablename__ = "member_good_valuations"

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
