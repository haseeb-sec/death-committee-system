"""enforce member good valuation date uniqueness

Revision ID: 9c7e1a4b2d6f
Revises: 8b4a2c7d91ef
Create Date: 2026-09-20
"""

from alembic import op


revision = "9c7e1a4b2d6f"
down_revision = "8b4a2c7d91ef"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("member_good_valuations") as batch_op:
        batch_op.create_unique_constraint(
            "uq_member_good_valuations_good_date",
            ["good_id", "valuation_date"],
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("member_good_valuations") as batch_op:
        batch_op.drop_constraint(
            "uq_member_good_valuations_good_date",
            type_="unique",
        )
