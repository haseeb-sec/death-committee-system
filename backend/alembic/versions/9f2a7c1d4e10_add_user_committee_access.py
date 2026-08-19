"""Add user committee access control

Revision ID: 9f2a7c1d4e10
Revises: 7180ec133767
Create Date: 2026-08-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9f2a7c1d4e10"
down_revision: Union[str, Sequence[str], None] = "7180ec133767"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_committee_access",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("committee_id", sa.Integer(), nullable=False),
        sa.Column("granted_by_user_id", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("granted_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["committee_id"], ["committees.id"]),
        sa.ForeignKeyConstraint(["granted_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "committee_id",
            name="uq_user_committee_access",
        ),
    )

    op.create_index(
        "ix_user_committee_access_user_id",
        "user_committee_access",
        ["user_id"],
    )

    op.create_index(
        "ix_user_committee_access_committee_id",
        "user_committee_access",
        ["committee_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_user_committee_access_committee_id",
        table_name="user_committee_access",
    )
    op.drop_index(
        "ix_user_committee_access_user_id",
        table_name="user_committee_access",
    )
    op.drop_table("user_committee_access")
