from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class JournalLine(Base):
    __tablename__ = "journal_lines"

    id: Mapped[int] = mapped_column(primary_key=True)

    journal_entry_id: Mapped[int] = mapped_column(
        ForeignKey("journal_entries.id"),
        nullable=False,
    )

    account_id: Mapped[int] = mapped_column(
        ForeignKey("accounts.id"),
        nullable=False,
    )

    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    journal_entry: Mapped["JournalEntry"] = relationship(
        back_populates="lines",
    )

    account: Mapped["Account"] = relationship(
        back_populates="journal_lines",
    )
