from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class AssetParticipation(Base):
    __tablename__ = "asset_participations"

    __table_args__ = (
        UniqueConstraint(
            "asset_id",
            "member_id",
            name="uq_asset_participations_asset_member",
        ),
    )

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
