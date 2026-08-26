"""Enforce one-to-one member user relationship.

Revision ID: f5677f5fc399
Revises: 6d0addaf9dd1
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from datetime import datetime
import secrets
from argon2 import PasswordHasher


revision = "f5677f5fc399"
down_revision = "6d0addaf9dd1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    # Existing members were created before every member had a User account.
    # Create a User for each member that does not yet have one.
    rows = bind.execute(
        text("""
            SELECT id, name, committee_id
            FROM members
            WHERE user_id IS NULL
            ORDER BY id
        """)
    ).fetchall()

    ph = PasswordHasher()

    for member_id, name, committee_id in rows:
        username = f"member_{member_id}_{secrets.token_hex(4)}"

        # Temporary migration password. The normal application flow should
        # require the member/admin to establish the real credentials.
        password_hash = ph.hash(secrets.token_urlsafe(24))

        result = bind.execute(
            text("""
                INSERT INTO users
                    (username, password_hash, role, is_active, created_at)
                VALUES
                    (:username, :password_hash, :role, :is_active, :created_at)
            """),
            {
                "username": username,
                "password_hash": password_hash,
                "role": "VIEWER",
                "is_active": 1,
                "created_at": datetime.utcnow(),
            },
        )

        user_id = result.lastrowid

        bind.execute(
            text("""
                UPDATE members
                SET user_id = :user_id
                WHERE id = :member_id
            """),
            {
                "user_id": user_id,
                "member_id": member_id,
            },
        )

    # SQLite cannot directly ALTER a column from nullable to NOT NULL.
    # Alembic batch mode recreates the table safely.
    with op.batch_alter_table("members", schema=None) as batch_op:
        batch_op.alter_column(
            "user_id",
            existing_type=sa.Integer(),
            nullable=False,
        )


def downgrade() -> None:
    with op.batch_alter_table("members", schema=None) as batch_op:
        batch_op.alter_column(
            "user_id",
            existing_type=sa.Integer(),
            nullable=True,
        )
