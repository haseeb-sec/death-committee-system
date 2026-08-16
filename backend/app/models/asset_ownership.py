from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class AssetOwnership(Base):
    __tablename__ = "asset_ownerships"

    id: Mapped[int] = mapped_column(primary_key=True)

    asset_id: Mapped[int] = mapped_column(
        ForeignKey("committee_assets.id"),
        nullable=False,
    )

    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id"),
        nullable=False,
    )

    ownership_units: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    total_units: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    asset: Mapped["CommitteeAsset"] = relationship()

    member: Mapped["Member"] = relationship()
