"""enforce asset valuation date uniqueness

Revision ID: 8b4a2c7d91ef
Revises: 6f1873b140df
Create Date: 2026-09-20
"""

from alembic import op


revision = "8b4a2c7d91ef"
down_revision = "6f1873b140df"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("asset_valuations") as batch_op:
        batch_op.create_unique_constraint(
            "uq_asset_valuations_asset_date",
            ["asset_id", "valuation_date"],
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("asset_valuations") as batch_op:
        batch_op.drop_constraint(
            "uq_asset_valuations_asset_date",
            type_="unique",
        )
