from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class DeathSupport(Base):
    __tablename__ = "death_supports"

    id: Mapped[int] = mapped_column(primary_key=True)

    committee_id: Mapped[int] = mapped_column(
        ForeignKey("committees.id"),
        nullable=False,
    )

    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id"),
        nullable=False,
        unique=True,
    )

    beneficiary_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    support_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    reference: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    committee: Mapped["Committee"] = relationship()

    member: Mapped["Member"] = relationship()
