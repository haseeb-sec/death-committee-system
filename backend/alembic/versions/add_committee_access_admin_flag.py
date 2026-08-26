"""add committee-level admin flag

Revision ID: add_committee_access_admin_flag
Revises:
Create Date: 2026-08-25
"""

from alembic import op
import sqlalchemy as sa


revision = "add_committee_access_admin_flag"
down_revision = "f5677f5fc399"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_committee_access",
        sa.Column(
            "is_admin",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("user_committee_access", "is_admin")
