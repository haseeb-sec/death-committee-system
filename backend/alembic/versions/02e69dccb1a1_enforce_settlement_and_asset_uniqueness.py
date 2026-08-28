"""Enforce settlement and asset ownership/participation uniqueness.

Revision ID: 02e69dccb1a1
Revises: add_committee_access_admin_flag
Create Date: 2026-08-28

Locks in three financial-integrity invariants at the database level
that were previously enforced only in application code:

  * A member can be settled at most once
    (member_settlements.member_id is unique).

  * A member can have at most one current-ownership row per asset
    (asset_ownerships is unique on (asset_id, member_id)).

  * A member can have at most one historical-participation row per
    asset (asset_participations is unique on (asset_id, member_id)).

Before adding each constraint, existing data is checked for
duplicates. If any are found, the migration raises rather than
silently deleting or merging rows, since historical financial
records must never be silently rewritten.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


revision = "02e69dccb1a1"
down_revision = "add_committee_access_admin_flag"
branch_labels = None
depends_on = None


def _assert_no_duplicates(bind, *, table, group_by_columns, label):
    columns_sql = ", ".join(group_by_columns)

    rows = bind.execute(
        text(
            f"""
            SELECT {columns_sql}, COUNT(*) AS c
            FROM {table}
            GROUP BY {columns_sql}
            HAVING COUNT(*) > 1
            """
        )
    ).fetchall()

    if rows:
        raise RuntimeError(
            f"Cannot enforce uniqueness on {label}: "
            f"{len(rows)} duplicate group(s) already exist in "
            f"'{table}'. Resolve these records manually before "
            f"re-running this migration. Example duplicate keys: "
            f"{rows[:5]}"
        )


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    _assert_no_duplicates(
        bind,
        table="member_settlements",
        group_by_columns=["member_id"],
        label="member_settlements.member_id",
    )

    _assert_no_duplicates(
        bind,
        table="asset_ownerships",
        group_by_columns=["asset_id", "member_id"],
        label="asset_ownerships (asset_id, member_id)",
    )

    _assert_no_duplicates(
        bind,
        table="asset_participations",
        group_by_columns=["asset_id", "member_id"],
        label="asset_participations (asset_id, member_id)",
    )

    settlement_unique = {
        c.get("name")
        for c in inspector.get_unique_constraints("member_settlements")
    }

    with op.batch_alter_table("member_settlements", schema=None) as batch_op:
        if "uq_member_settlements_member_id" not in settlement_unique:
            batch_op.create_unique_constraint(
                "uq_member_settlements_member_id",
                ["member_id"],
            )

    ownership_unique = {
        c.get("name")
        for c in inspector.get_unique_constraints("asset_ownerships")
    }

    with op.batch_alter_table("asset_ownerships", schema=None) as batch_op:
        if "uq_asset_ownerships_asset_member" not in ownership_unique:
            batch_op.create_unique_constraint(
                "uq_asset_ownerships_asset_member",
                ["asset_id", "member_id"],
            )

    participation_unique = {
        c.get("name")
        for c in inspector.get_unique_constraints("asset_participations")
    }

    with op.batch_alter_table("asset_participations", schema=None) as batch_op:
        if "uq_asset_participations_asset_member" not in participation_unique:
            batch_op.create_unique_constraint(
                "uq_asset_participations_asset_member",
                ["asset_id", "member_id"],
            )


def downgrade() -> None:
    with op.batch_alter_table("asset_participations", schema=None) as batch_op:
        batch_op.drop_constraint(
            "uq_asset_participations_asset_member",
            type_="unique",
        )

    with op.batch_alter_table("asset_ownerships", schema=None) as batch_op:
        batch_op.drop_constraint(
            "uq_asset_ownerships_asset_member",
            type_="unique",
        )

    with op.batch_alter_table("member_settlements", schema=None) as batch_op:
        batch_op.drop_constraint(
            "uq_member_settlements_member_id",
            type_="unique",
        )
