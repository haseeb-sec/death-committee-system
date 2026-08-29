"""add committee context to audit logs

Revision ID: f155861817bd
Revises: 02e69dccb1a1
Create Date: 2026-08-28 17:23:34.806335
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f155861817bd'
down_revision: Union[str, Sequence[str], None] = '02e69dccb1a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('committee_id', sa.Integer(), nullable=True))
        batch_op.create_index(
            'ix_audit_logs_committee_created_at',
            ['committee_id', 'created_at'],
            unique=False,
        )
        batch_op.create_foreign_key(
            'fk_audit_logs_committee_id_committees',
            'committees',
            ['committee_id'],
            ['id'],
        )


def downgrade() -> None:
    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        batch_op.drop_constraint(
            'fk_audit_logs_committee_id_committees',
            type_='foreignkey',
        )
        batch_op.drop_index('ix_audit_logs_committee_created_at')
        batch_op.drop_column('committee_id')
