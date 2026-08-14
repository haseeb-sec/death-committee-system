"""Add committee relationship to accounts

Revision ID: 07519867a5b1
Revises: 741a18722e56
Create Date: 2026-08-14 17:16:20.380494

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "07519867a5b1"
down_revision: Union[str, Sequence[str], None] = "741a18722e56"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    with op.batch_alter_table("accounts") as batch_op:
        batch_op.add_column(
            sa.Column(
                "committee_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.create_foreign_key(
            "fk_accounts_committee_id_committees",
            "committees",
            ["committee_id"],
            ["id"],
        )


def downgrade() -> None:
    """Downgrade schema."""

    with op.batch_alter_table("accounts") as batch_op:
        batch_op.drop_constraint(
            "fk_accounts_committee_id_committees",
            type_="foreignkey",
        )

        batch_op.drop_column("committee_id")