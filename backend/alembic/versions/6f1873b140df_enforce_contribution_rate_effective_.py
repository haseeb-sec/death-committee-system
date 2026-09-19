"""enforce contribution rate effective date uniqueness

Revision ID: 6f1873b140df
Revises: 7fdfb6915811
Create Date: 2026-09-19 23:38:54.512895

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "6f1873b140df"
down_revision: Union[str, Sequence[str], None] = "7fdfb6915811"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("contribution_rates") as batch_op:
        batch_op.create_unique_constraint(
            "uq_contribution_rates_committee_effective_from",
            ["committee_id", "effective_from"],
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("contribution_rates") as batch_op:
        batch_op.drop_constraint(
            "uq_contribution_rates_committee_effective_from",
            type_="unique",
        )
