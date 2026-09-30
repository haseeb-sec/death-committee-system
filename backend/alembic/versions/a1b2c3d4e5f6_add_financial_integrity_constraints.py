"""add financial integrity constraints

Revision ID: a1b2c3d4e5f6
Revises: 9c7e1a4b2d6f
Create Date: 2026-09-29
"""

from alembic import op


revision = "a1b2c3d4e5f6"
down_revision = "9c7e1a4b2d6f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add database-level financial integrity constraints."""

    with op.batch_alter_table("member_dues") as batch_op:
        batch_op.create_check_constraint(
            "ck_member_dues_amount_nonnegative",
            "amount >= 0",
        )
        batch_op.create_check_constraint(
            "ck_member_dues_paid_amount_nonnegative",
            "paid_amount >= 0",
        )
        batch_op.create_check_constraint(
            "ck_member_dues_paid_amount_not_exceed_amount",
            "paid_amount <= amount",
        )

    with op.batch_alter_table("member_goods") as batch_op:
        batch_op.create_check_constraint(
            "ck_member_goods_purchase_price_nonnegative",
            "purchase_price >= 0",
        )
        batch_op.create_check_constraint(
            "ck_member_goods_current_value_nonnegative",
            "current_value >= 0",
        )

    with op.batch_alter_table("member_good_valuations") as batch_op:
        batch_op.create_check_constraint(
            "ck_member_good_valuations_value_nonnegative",
            "value >= 0",
        )

    with op.batch_alter_table("member_settlements") as batch_op:
        batch_op.create_check_constraint(
            "ck_member_settlements_contribution_balance_nonnegative",
            "contribution_balance >= 0",
        )
        batch_op.create_check_constraint(
            "ck_member_settlements_asset_share_nonnegative",
            "asset_share >= 0",
        )
        batch_op.create_check_constraint(
            "ck_member_settlements_goods_value_nonnegative",
            "goods_value >= 0",
        )
        batch_op.create_check_constraint(
            "ck_member_settlements_gross_amount_nonnegative",
            "gross_amount >= 0",
        )
        batch_op.create_check_constraint(
            "ck_member_settlements_outstanding_dues_nonnegative",
            "outstanding_dues >= 0",
        )


def downgrade() -> None:
    """Remove database-level financial integrity constraints."""

    with op.batch_alter_table("member_settlements") as batch_op:
        batch_op.drop_constraint(
            "ck_member_settlements_outstanding_dues_nonnegative",
            type_="check",
        )
        batch_op.drop_constraint(
            "ck_member_settlements_gross_amount_nonnegative",
            type_="check",
        )
        batch_op.drop_constraint(
            "ck_member_settlements_goods_value_nonnegative",
            type_="check",
        )
        batch_op.drop_constraint(
            "ck_member_settlements_asset_share_nonnegative",
            type_="check",
        )
        batch_op.drop_constraint(
            "ck_member_settlements_contribution_balance_nonnegative",
            type_="check",
        )

    with op.batch_alter_table("member_good_valuations") as batch_op:
        batch_op.drop_constraint(
            "ck_member_good_valuations_value_nonnegative",
            type_="check",
        )

    with op.batch_alter_table("member_goods") as batch_op:
        batch_op.drop_constraint(
            "ck_member_goods_current_value_nonnegative",
            type_="check",
        )
        batch_op.drop_constraint(
            "ck_member_goods_purchase_price_nonnegative",
            type_="check",
        )

    with op.batch_alter_table("member_dues") as batch_op:
        batch_op.drop_constraint(
            "ck_member_dues_paid_amount_not_exceed_amount",
            type_="check",
        )
        batch_op.drop_constraint(
            "ck_member_dues_paid_amount_nonnegative",
            type_="check",
        )
        batch_op.drop_constraint(
            "ck_member_dues_amount_nonnegative",
            type_="check",
        )
