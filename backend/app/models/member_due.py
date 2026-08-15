from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class MemberDue(Base):
    __tablename__ = "member_dues"

    id: Mapped[int] = mapped_column(primary_key=True)

    committee_id: Mapped[int] = mapped_column(
        ForeignKey("committees.id"),
        nullable=False,
    )

    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id"),
        nullable=False,
    )

    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    paid_amount: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    due_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    reference: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    committee: Mapped["Committee"] = relationship()

    member: Mapped["Member"] = relationship()
