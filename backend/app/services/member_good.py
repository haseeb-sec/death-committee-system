from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Member, MemberGood, MemberGoodValuation
from app.services.accounting import AccountingError


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
    Record a good purchased specifically using a member's funds.

    The initial current value equals the purchase price.
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
    Return the current total value of a member's goods.
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
