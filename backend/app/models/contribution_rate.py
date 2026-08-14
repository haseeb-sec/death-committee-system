from datetime import date

from sqlalchemy import Date, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class ContributionRate(Base):
    __tablename__ = "contribution_rates"

    id: Mapped[int] = mapped_column(primary_key=True)

    committee_id: Mapped[int] = mapped_column(
        ForeignKey("committees.id"),
        nullable=False,
    )

    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    effective_from: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    committee: Mapped["Committee"] = relationship(
    back_populates="contribution_rates",
)