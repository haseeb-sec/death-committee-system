from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class UserCommitteeAccess(Base):
    __tablename__ = "user_committee_access"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "committee_id",
            name="uq_user_committee_access",
        ),
        Index("ix_user_committee_access_user_id", "user_id"),
        Index("ix_user_committee_access_committee_id", "committee_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    committee_id: Mapped[int] = mapped_column(
        ForeignKey("committees.id"),
        nullable=False,
    )

    granted_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    granted_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
