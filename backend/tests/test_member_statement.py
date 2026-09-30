from datetime import date

from app.models import ContributionRate
from app.services.committee import create_committee
from app.services.contribution import record_contribution
from app.services.member import add_member
from app.services.member_settlement import (
    pay_member_settlement,
    settle_member,
)
from app.services.member_statement import get_member_statement


def test_member_statement_returns_customer_facing_amounts_in_order(db):
    committee = create_committee(
        db,
        name="Member Statement Committee",
    )
    db.flush()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Statement Test Member",
        joined_on=date(2026, 8, 17),
    )
    db.flush()

    db.add(
        ContributionRate(
            committee_id=committee.id,
            amount=70000,
            effective_from=date(2026, 8, 17),
        )
    )
    db.flush()

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 8, 17),
        reference="STATEMENT-CONTRIBUTION",
    )
    db.flush()

    settlement = settle_member(
        db,
        member_id=member.id,
        settlement_date=date(2026, 8, 18),
    )
    db.flush()

    pay_member_settlement(
        db,
        settlement_id=settlement.id,
    )
    db.flush()

    statement = get_member_statement(
        db,
        member_id=member.id,
    )

    assert len(statement) == 2

    assert statement[0]["date"] == date(2026, 8, 17)
    assert statement[0]["reference"] == "STATEMENT-CONTRIBUTION"
    assert statement[0]["amount"] == 70000

    assert statement[1]["date"] == date(2026, 8, 18)
    assert statement[1]["amount"] == -70000
