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

    # Total actual death-related expense.
    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Portion of the death expense covered from the
    # member's own accumulated committee balance.
    member_funded_amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    # Portion actually advanced by the committee as
    # Qarz-e-Hasana (قرضِ حسنہ).
    qarz_e_hasana_amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
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
