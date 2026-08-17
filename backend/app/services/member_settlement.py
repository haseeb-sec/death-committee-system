from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Account,
    AccountType,
    DeathSupport,
    JournalLine,
    Member,
    MemberGood,
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

        Contribution cash balance
        + Current committee asset share
        + Current member-good value
        - Outstanding dues
        = Final settlement amount

    This function only calculates the settlement.
    It does not change accounting records, ownership,
    member status, or goods.
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
    Create and freeze a member settlement.

    The settlement snapshot is calculated before current asset
    ownership is redistributed.

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

    # Freeze the departing member's asset share before
    # redistributing current ownership.
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

    Accounting:

        Member Account       +cash contribution balance
        Settlement Expense   +asset share + goods value
        Committee Cash       -final settlement amount

    The member account contains only the member's remaining
    refundable cash contribution balance.

    Committee asset shares and member-good values are separate
    settlement components.

    IMPORTANT:

    The settlement amount is an entitlement, not automatically
    available committee cash.

    The committee must actually have enough cash to pay the
    final settlement. No accounting entry may create money that
    does not exist.

    After successful payment:

        - settlement becomes paid
        - refundable member cash balance is cleared
        - active member goods included in the settlement are closed

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

    if record.outstanding_dues != 0:
        raise AccountingError(
            "Settlement with outstanding dues cannot be paid."
        )

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

    if amount == 0:
        record.status = "paid"

        db.flush()

        return record

    # Committee cash is represented using signed journal lines:
    #
    # contribution      -> positive cash
    # purchase          -> negative cash
    # settlement        -> negative cash
    #
    # Therefore the current available cash is the sum of all
    # journal lines belonging to the committee cash account.
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

    lines = []

    if record.contribution_balance > 0:
        lines.append(
            (
                member.account.id,
                record.contribution_balance,
            )
        )

    if settlement_asset_and_goods > 0:
        lines.append(
            (
                settlement_expense_account.id,
                settlement_asset_and_goods,
            )
        )

    lines.append(
        (
            cash_account.id,
            -amount,
        )
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

    # The cash portion of the member's account is now settled.
    #
    # Member goods were already represented separately as
    # refundable settlement value. Once that settlement is paid,
    # those goods must no longer appear as active refundable
    # goods for the member.
    goods = db.scalars(
        select(MemberGood)
        .where(
            MemberGood.member_id == member.id,
            MemberGood.is_active.is_(True),
        )
    ).all()

    for good in goods:
        good.is_active = False

    record.status = "paid"

    db.flush()

    return record
