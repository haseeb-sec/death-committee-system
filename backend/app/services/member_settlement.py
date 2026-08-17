from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Account,
    AccountType,
    DeathSupport,
    JournalLine,
    Member,
    MemberSettlement,
)
from app.services.accounting import (
    AccountingError,
    create_journal_entry,
)
from app.services.asset_ownership import (
    redistribute_member_asset_ownership,
)
from app.services.asset_share import (
    get_member_asset_breakdown,
    get_member_asset_share,
)
from app.services.member_balance import get_member_balance
from app.services.member_due import get_outstanding_dues
from app.services.member_good import get_member_goods_total


def get_member_settlement(
    db: Session,
    *,
    member_id: int,
) -> dict:
    """
    Calculate the current financial settlement for a member.

    Settlement consists of:

        Contribution balance
        + Asset share
        + Member goods value
        - Outstanding dues
        = Final settlement amount

    This function only calculates the settlement.
    It does not change the member, ownership, or accounting records.
    """

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    contribution_balance = get_member_balance(
        db,
        member_id=member_id,
    )

    asset_breakdown = get_member_asset_breakdown(
        db,
        member_id=member_id,
    )

    asset_share = get_member_asset_share(
        db,
        member_id=member_id,
    )

    goods_value = get_member_goods_total(
        db,
        member_id=member_id,
    )

    outstanding_dues = get_outstanding_dues(
        db,
        member_id=member_id,
    )

    gross_amount = (
        contribution_balance
        + asset_share
        + goods_value
    )

    final_amount = gross_amount - outstanding_dues

    return {
        "member_id": member_id,
        "contribution_balance": contribution_balance,
        "asset_share": asset_share,
        "asset_breakdown": asset_breakdown,
        "goods_value": goods_value,
        "outstanding_dues": outstanding_dues,
        "gross_amount": gross_amount,
        "final_amount": final_amount,
    }


def settle_member(
    db: Session,
    *,
    member_id: int,
    settlement_date: date,
) -> MemberSettlement:
    """
    Permanently settle a member.

    Normal voluntary exit requires an active member.

    A deceased member is different:
    record_death_support() marks the member inactive before
    the final financial settlement is completed. Therefore an
    inactive member is allowed to proceed only when a DeathSupport
    record exists for that member.

    Settlement performs:

        1. Verify the member and settlement state.
        2. Allow either:
           - active voluntary exit, or
           - inactive member with recorded death support.
        3. Calculate and freeze the financial position.
        4. Reject outstanding dues.
        5. Reject a negative settlement.
        6. Redistribute current asset ownership.
        7. Mark the member inactive.
        8. Preserve the settlement snapshot permanently.

    Historical AssetParticipation records are never modified.

    Actual cash payment is performed separately by
    pay_member_settlement().
    """

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    existing = db.scalars(
        select(MemberSettlement)
        .where(
            MemberSettlement.member_id == member_id,
        )
    ).first()

    if existing is not None:
        raise AccountingError(
            f"Member has already been settled: {member_id}"
        )

    death_support = db.scalars(
        select(DeathSupport)
        .where(
            DeathSupport.member_id == member_id,
        )
    ).first()

    is_death_settlement = death_support is not None

    if not member.is_active and not is_death_settlement:
        raise AccountingError(
            f"Member is already inactive: {member_id}"
        )

    settlement = get_member_settlement(
        db,
        member_id=member_id,
    )

    if settlement["outstanding_dues"] > 0:
        raise AccountingError(
            f"Member has outstanding dues: "
            f"{settlement['outstanding_dues']}"
        )

    if settlement["final_amount"] < 0:
        raise AccountingError(
            f"Settlement amount cannot be negative: "
            f"{settlement['final_amount']}"
        )

    # The settlement amount is calculated BEFORE ownership is
    # redistributed. This freezes the departing member's asset
    # value in the settlement record.
    #
    # Historical AssetParticipation records are never modified.
    redistribute_member_asset_ownership(
        db,
        member_id=member_id,
    )

    record = MemberSettlement(
        member_id=member_id,
        settlement_date=settlement_date,
        contribution_balance=settlement["contribution_balance"],
        asset_share=settlement["asset_share"],
        goods_value=settlement["goods_value"],
        gross_amount=settlement["gross_amount"],
        outstanding_dues=settlement["outstanding_dues"],
        final_amount=settlement["final_amount"],
        status="pending",
    )

    db.add(record)

    member.is_active = False

    if member.left_on is None:
        member.left_on = settlement_date

    db.flush()

    return record


def pay_member_settlement(
    db: Session,
    *,
    settlement_id: int,
) -> MemberSettlement:
    """
    Pay a pending member settlement.

    Accounting entry:

        Member Account       +contribution balance
        Settlement Expense   +(asset share + goods value)
        Committee Cash       -final settlement amount

    The member account represents only the member's refundable
    cash contribution balance.

    Asset share and member-good value are separate refundable
    components and must not be posted into the member account.

    The settlement status changes:

        pending -> paid

    A settlement can only be paid once.
    """

    record = db.get(
        MemberSettlement,
        settlement_id,
    )

    if record is None:
        raise AccountingError(
            f"Settlement not found: {settlement_id}"
        )

    if record.status != "pending":
        raise AccountingError(
            f"Settlement is not pending: {settlement_id}"
        )

    member = db.get(Member, record.member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {record.member_id}"
        )

    if member.account is None:
        raise AccountingError(
            f"Member account not found: {member.id}"
        )

    cash_account = db.scalars(
        select(Account)
        .where(
            Account.account_type == AccountType.CASH,
            Account.committee_id == member.committee_id,
            Account.member_id.is_(None),
        )
    ).first()

    if cash_account is None:
        raise AccountingError(
            "Committee cash account not found."
        )

    settlement_expense_account = db.scalars(
        select(Account)
        .where(
            Account.account_type == AccountType.EXPENSE,
            Account.committee_id == member.committee_id,
            Account.member_id.is_(None),
            Account.name == (
                f"Settlement Expense: {member.committee.name}"
            ),
        )
    ).first()

    if settlement_expense_account is None:
        raise AccountingError(
            "Committee settlement expense account not found."
        )

    amount = record.final_amount

    if amount < 0:
        raise AccountingError(
            f"Settlement amount cannot be negative: {amount}"
        )

    if amount == 0:
        record.status = "paid"

        db.flush()

        return record

    # Committee cash uses normal signed accounting:
    #
    #   contribution -> +cash
    #   asset purchase -> -cash
    #   settlement payment -> -cash
    #
    # Therefore available cash is the direct sum of
    # the cash account journal lines.
    cash_balance = sum(
        line.amount
        for line in db.scalars(
            select(JournalLine)
            .where(
                JournalLine.account_id == cash_account.id,
            )
        ).all()
    )

    if cash_balance < amount:
        raise AccountingError(
            f"Insufficient committee cash. "
            f"Required: {amount}, available: {cash_balance}"
        )

    # The settlement record is the frozen financial snapshot.
    #
    # The member account contains only the refundable cash
    # contribution balance. Asset share and member-good value
    # are paid from their own settlement component.
    settlement_asset_and_goods = (
        record.asset_share
        + record.goods_value
    )

    expected_final_amount = (
        record.contribution_balance
        + settlement_asset_and_goods
        - record.outstanding_dues
    )

    if expected_final_amount != record.final_amount:
        raise AccountingError(
            "Settlement record is internally inconsistent."
        )

    if record.outstanding_dues != 0:
        raise AccountingError(
            "Settlement with outstanding dues cannot be paid."
        )

    lines = []

    if record.contribution_balance > 0:
        lines.append(
            (member.account.id, record.contribution_balance)
        )

    if settlement_asset_and_goods > 0:
        lines.append(
            (
                settlement_expense_account.id,
                settlement_asset_and_goods,
            )
        )

    lines.append(
        (cash_account.id, -amount)
    )

    create_journal_entry(
        db,
        description=(
            f"Member settlement payment: {member.name}"
        ),
        entry_date=datetime.combine(
            record.settlement_date,
            datetime.min.time(),
        ),
        reference=f"SETTLEMENT-{record.id}",
        lines=lines,
    )

    record.status = "paid"

    db.flush()

    return record
