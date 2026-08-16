from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Account,
    AccountType,
    Member,
    MemberGood,
    MemberGoodValuation,
)
from app.services.accounting import (
    AccountingError,
    create_journal_entry,
)


def add_member_good(
    db: Session,
    *,
    member_id: int,
    name: str,
    purchase_date: date,
    purchase_price: int,
    description: str | None = None,
) -> MemberGood:
    """
    Record a good purchased using a member's accumulated funds.

    The purchase is treated as a transfer of value from the
    member's committee balance into a member-owned good.

    Accounting:

        Member Account   +purchase_price
        Committee Cash   -purchase_price

    The member's refundable cash balance therefore decreases,
    while the good becomes part of the member's refundable value.

    The good's current value is tracked separately and may change
    through later valuations.
    """

    name = name.strip()

    if not name:
        raise AccountingError(
            "Good name cannot be empty."
        )

    if purchase_price <= 0:
        raise AccountingError(
            "Purchase price must be greater than zero."
        )

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    if not member.is_active:
        raise AccountingError(
            f"Member is not active: {member_id}"
        )

    if purchase_date < member.joined_on:
        raise AccountingError(
            "Purchase date cannot be before member joining date."
        )

    if member.account is None:
        raise AccountingError(
            f"Member account not found: {member_id}"
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

    # The member must actually have enough accumulated balance
    # to purchase the good.
    member_balance = -sum(
        line.amount
        for line in member.account.journal_lines
    )

    if member_balance < purchase_price:
        raise AccountingError(
            f"Insufficient member balance. "
            f"Required: {purchase_price}, "
            f"available: {member_balance}"
        )

    good = MemberGood(
        member_id=member.id,
        name=name,
        purchase_date=purchase_date,
        purchase_price=purchase_price,
        current_value=purchase_price,
        description=description,
        is_active=True,
    )

    db.add(good)
    db.flush()

    valuation = MemberGoodValuation(
        good_id=good.id,
        valuation_date=purchase_date,
        value=purchase_price,
    )

    db.add(valuation)

    create_journal_entry(
        db,
        description=f"Member good purchase: {name}",
        entry_date=datetime.combine(
            purchase_date,
            datetime.min.time(),
        ),
        reference=f"MEMBER-GOOD-{good.id}",
        lines=[
            # Reduce the member's refundable cash balance.
            (member.account.id, purchase_price),

            # Committee cash is used to acquire the good.
            (cash_account.id, -purchase_price),
        ],
    )

    db.flush()

    return good


def update_member_good_value(
    db: Session,
    *,
    good_id: int,
    valuation_date: date,
    new_value: int,
) -> MemberGood:
    """
    Record a new current value while preserving
    previous valuation history.

    Valuation changes do not create cash transactions because
    the good remains a member-owned refundable asset.
    """

    if new_value < 0:
        raise AccountingError(
            "Good value cannot be negative."
        )

    good = db.get(MemberGood, good_id)

    if good is None:
        raise AccountingError(
            f"Member good not found: {good_id}"
        )

    if valuation_date < good.purchase_date:
        raise AccountingError(
            "Valuation date cannot be before purchase date."
        )

    valuation = MemberGoodValuation(
        good_id=good.id,
        valuation_date=valuation_date,
        value=new_value,
    )

    db.add(valuation)

    good.current_value = new_value

    db.flush()

    return good


def get_member_goods(
    db: Session,
    *,
    member_id: int,
) -> list[MemberGood]:
    """
    Return all active goods belonging to a member.
    """

    member = db.get(Member, member_id)

    if member is None:
        raise AccountingError(
            f"Member not found: {member_id}"
        )

    return db.scalars(
        select(MemberGood)
        .where(
            MemberGood.member_id == member_id,
            MemberGood.is_active.is_(True),
        )
        .order_by(
            MemberGood.purchase_date.asc(),
            MemberGood.id.asc(),
        )
    ).all()


def get_member_goods_total(
    db: Session,
    *,
    member_id: int,
) -> int:
    """
    Return the current total refundable value of
    all active goods belonging to a member.
    """

    goods = get_member_goods(
        db,
        member_id=member_id,
    )

    return sum(
        good.current_value
        for good in goods
    )


def get_good_valuations(
    db: Session,
    *,
    good_id: int,
) -> list[MemberGoodValuation]:
    """
    Return complete valuation history for a member good.
    """

    good = db.get(MemberGood, good_id)

    if good is None:
        raise AccountingError(
            f"Member good not found: {good_id}"
        )

    return db.scalars(
        select(MemberGoodValuation)
        .where(
            MemberGoodValuation.good_id == good_id,
        )
        .order_by(
            MemberGoodValuation.valuation_date.asc(),
            MemberGoodValuation.id.asc(),
        )
    ).all()
