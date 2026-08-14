"""Add committee members and contribution rates

Revision ID: 741a18722e56
Revises: 3f673be5ad31
Create Date: 2026-08-14 16:40:38.666640

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "741a18722e56"
down_revision: Union[str, Sequence[str], None] = "3f673be5ad31"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        "committees",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "contribution_rates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("committee_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(
            ["committee_id"],
            ["committees.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("committee_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("joined_on", sa.Date(), nullable=False),
        sa.Column("left_on", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["committee_id"],
            ["committees.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    with op.batch_alter_table("accounts") as batch_op:
        batch_op.add_column(
            sa.Column("member_id", sa.Integer(), nullable=True)
        )

        batch_op.create_unique_constraint(
            "uq_accounts_member_id",
            ["member_id"],
        )

        batch_op.create_foreign_key(
            "fk_accounts_member_id_members",
            "members",
            ["member_id"],
            ["id"],
        )


def downgrade() -> None:
    """Downgrade schema."""

    with op.batch_alter_table("accounts") as batch_op:
        batch_op.drop_constraint(
            "fk_accounts_member_id_members",
            type_="foreignkey",
        )

        batch_op.drop_constraint(
            "uq_accounts_member_id",
            type_="unique",
        )

        batch_op.drop_column("member_id")

    op.drop_table("members")
    op.drop_table("contribution_rates")
    op.drop_table("committees")