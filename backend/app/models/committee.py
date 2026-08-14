from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Committee(Base):
    __tablename__ = "committees"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    members: Mapped[list["Member"]] = relationship(
        back_populates="committee",
        cascade="all, delete-orphan",
    )

    contribution_rates: Mapped[list["ContributionRate"]] = relationship(
        back_populates="committee",
        cascade="all, delete-orphan",
    )