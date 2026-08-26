"""link members to user accounts

Revision ID: 6d0addaf9dd1
Revises: a674db22e5f2
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6d0addaf9dd1"
down_revision: Union[str, Sequence[str], None] = "a674db22e5f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("members")}
    unique_constraints = {
        constraint.get("name")
        for constraint in inspector.get_unique_constraints("members")
    }
    foreign_keys = {
        fk.get("name")
        for fk in inspector.get_foreign_keys("members")
    }

    with op.batch_alter_table("members", schema=None) as batch_op:
        if "user_id" not in columns:
            batch_op.add_column(
                sa.Column("user_id", sa.Integer(), nullable=True)
            )

        if "uq_members_user_id" not in unique_constraints:
            batch_op.create_unique_constraint(
                "uq_members_user_id",
                ["user_id"],
            )

        if "fk_members_user_id_users" not in foreign_keys:
            batch_op.create_foreign_key(
                "fk_members_user_id_users",
                "users",
                ["user_id"],
                ["id"],
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("members")}
    unique_constraints = {
        constraint.get("name")
        for constraint in inspector.get_unique_constraints("members")
    }
    foreign_keys = {
        fk.get("name")
        for fk in inspector.get_foreign_keys("members")
    }

    with op.batch_alter_table("members", schema=None) as batch_op:
        if "fk_members_user_id_users" in foreign_keys:
            batch_op.drop_constraint(
                "fk_members_user_id_users",
                type_="foreignkey",
            )

        if "uq_members_user_id" in unique_constraints:
            batch_op.drop_constraint(
                "uq_members_user_id",
                type_="unique",
            )

        if "user_id" in columns:
            batch_op.drop_column("user_id")
