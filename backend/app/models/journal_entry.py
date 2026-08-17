from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(primary_key=True)

    entry_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    reference: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    reverses_entry_id: Mapped[int | None] = mapped_column(
        ForeignKey("journal_entries.id"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    lines: Mapped[list["JournalLine"]] = relationship(
        back_populates="journal_entry",
        cascade="all, delete-orphan",
    )

    reversed_entry: Mapped["JournalEntry | None"] = relationship(
        remote_side="JournalEntry.id",
        foreign_keys=[reverses_entry_id],
    )