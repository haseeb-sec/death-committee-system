from datetime import date

from fastapi.testclient import TestClient

from app.api.auth import get_current_user
from app.api.dependencies import get_db
from app.main import app
from app.models import (
    Committee,
    DeathSupport,
    JournalEntry,
    MemberSettlement,
    User,
    UserCommitteeAccess,
    UserRole,
)
from app.services.committee import create_committee
from app.services.member import add_member


def _client_as(db, user):
    def override_get_db():
        yield db

    def override_get_current_user():
        return user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    return TestClient(app)


def _member(db, committee, *, name, username):
    return add_member(
        db,
        committee_id=committee.id,
        username=username,
        password="test-password",
        name=name,
        joined_on=date(2026, 1, 1),
    )


def _admin_for(db, committee, *, username):
    admin = User(
        username=username,
        password_hash="unused",
        role=UserRole.COMMITTEE_ADMIN.value,
        is_active=True,
    )
    db.add(admin)
    db.flush()
    db.add(
        UserCommitteeAccess(
            user_id=admin.id,
            committee_id=committee.id,
            granted_by_user_id=admin.id,
            is_active=True,
            is_admin=True,
        )
    )
    db.commit()
    return admin


def test_member_cannot_create_settlement_via_api(db):
    committee = create_committee(db, name="Settlement Auth Committee")
    member = _member(
        db, committee, name="Settlement Auth Member",
        username="settlement_auth_member",
    )
    db.commit()
    member_user = db.get(User, member.user_id)

    client = _client_as(db, member_user)
    try:
        response = client.post(
            f"/members/{member.id}/settlement",
            json={"settlement_date": "2026-10-13"},
        )

        assert response.status_code == 404
        assert db.query(MemberSettlement).filter_by(
            member_id=member.id
        ).count() == 0
        assert db.query(JournalEntry).count() == 0
    finally:
        app.dependency_overrides.clear()


def test_member_cannot_pay_settlement_via_api(db):
    committee = create_committee(db, name="Settlement Payment Auth Committee")
    member = _member(
        db, committee, name="Settlement Payment Auth Member",
        username="settlement_payment_auth_member",
    )
    settlement = MemberSettlement(
        member_id=member.id,
        settlement_date=date(2026, 10, 13),
        contribution_balance=1000,
        asset_share=0,
        goods_value=0,
        gross_amount=1000,
        outstanding_dues=0,
        final_amount=1000,
        status="pending",
    )
    db.add(settlement)
    db.commit()
    settlement_id = settlement.id
    member_user = db.get(User, member.user_id)
    journal_count_before = db.query(JournalEntry).count()

    client = _client_as(db, member_user)
    try:
        response = client.post(
            f"/members/settlement/{settlement_id}/pay"
        )

        db.refresh(settlement)
        assert response.status_code == 404
        assert settlement.status == "pending"
        assert db.query(JournalEntry).count() == journal_count_before
    finally:
        app.dependency_overrides.clear()


def test_member_cannot_create_death_support_via_api(db):
    committee = create_committee(db, name="Death Support Auth Committee")
    member = _member(
        db, committee, name="Death Support Auth Member",
        username="death_support_auth_member",
    )
    db.commit()
    member_user = db.get(User, member.user_id)

    client = _client_as(db, member_user)
    try:
        response = client.post(
            f"/members/{member.id}/death-support",
            json={
                "beneficiary_name": "Test Beneficiary",
                "amount": 1000,
                "support_date": "2026-10-13",
                "reference": "AUTH-TEST",
            },
        )

        assert response.status_code == 404
        assert db.query(DeathSupport).filter_by(
            member_id=member.id
        ).count() == 0
        assert db.query(JournalEntry).count() == 0
    finally:
        app.dependency_overrides.clear()


def test_committee_admin_cannot_create_death_support_for_another_committee(db):
    committee_a = create_committee(db, name="Death Support Committee A")
    committee_b = create_committee(db, name="Death Support Committee B")
    member_a = _member(
        db, committee_a, name="Committee A Member",
        username="death_support_committee_a_member",
    )
    admin_b = _admin_for(
        db, committee_b, username="death_support_committee_b_admin"
    )
    db.commit()

    client = _client_as(db, admin_b)
    try:
        response = client.post(
            f"/members/{member_a.id}/death-support",
            json={
                "beneficiary_name": "Unauthorized Beneficiary",
                "amount": 1000,
                "support_date": "2026-10-13",
                "reference": "CROSS-COMMITTEE-TEST",
            },
        )

        assert response.status_code == 404
        assert db.query(DeathSupport).filter_by(
            member_id=member_a.id
        ).count() == 0
    finally:
        app.dependency_overrides.clear()


def test_committee_admin_cannot_create_settlement_for_another_committee(db):
    committee_a = create_committee(db, name="Settlement Committee A")
    committee_b = create_committee(db, name="Settlement Committee B")
    member_a = _member(
        db, committee_a, name="Settlement Committee A Member",
        username="settlement_committee_a_member",
    )
    admin_b = _admin_for(
        db, committee_b, username="settlement_committee_b_admin"
    )
    db.commit()

    client = _client_as(db, admin_b)
    try:
        response = client.post(
            f"/members/{member_a.id}/settlement",
            json={"settlement_date": "2026-10-13"},
        )

        assert response.status_code == 404
        assert db.query(MemberSettlement).filter_by(
            member_id=member_a.id
        ).count() == 0
    finally:
        app.dependency_overrides.clear()


def test_committee_admin_cannot_pay_another_committees_settlement(db):
    committee_a = create_committee(db, name="Settlement Payment Committee A")
    committee_b = create_committee(db, name="Settlement Payment Committee B")
    member_a = _member(
        db, committee_a, name="Settlement Payment Committee A Member",
        username="settlement_payment_committee_a_member",
    )
    settlement = MemberSettlement(
        member_id=member_a.id,
        settlement_date=date(2026, 10, 13),
        contribution_balance=1000,
        asset_share=0,
        goods_value=0,
        gross_amount=1000,
        outstanding_dues=0,
        final_amount=1000,
        status="pending",
    )
    db.add(settlement)
    db.commit()

    admin_b = _admin_for(
        db, committee_b, username="settlement_payment_committee_b_admin"
    )
    settlement_id = settlement.id
    journal_count_before = db.query(JournalEntry).count()

    client = _client_as(db, admin_b)
    try:
        response = client.post(
            f"/members/settlement/{settlement_id}/pay"
        )

        db.refresh(settlement)
        assert response.status_code == 404
        assert settlement.status == "pending"
        assert db.query(JournalEntry).count() == journal_count_before
    finally:
        app.dependency_overrides.clear()


def test_member_cannot_create_good_for_self_via_api(db):
    from app.models import MemberGood

    committee = create_committee(db, name="Member Good Create Auth Committee")
    member = _member(
        db,
        committee,
        name="Member Good Create Auth Member",
        username="member_good_create_auth_member",
    )
    db.flush()
    db.add(
        UserCommitteeAccess(
            user_id=member.user_id,
            committee_id=committee.id,
            granted_by_user_id=member.user_id,
            is_active=True,
            is_admin=False,
        )
    )
    db.commit()
    member_user = db.get(User, member.user_id)
    journal_count_before = db.query(JournalEntry).count()

    client = _client_as(db, member_user)
    try:
        response = client.post(
            f"/members/{member.id}/goods",
            json={
                "name": "Unauthorized Laptop",
                "purchase_date": "2026-10-13",
                "purchase_price": 100,
                "description": "Authorization regression test",
            },
        )

        assert response.status_code == 404
        assert db.query(MemberGood).filter_by(
            member_id=member.id
        ).count() == 0
        assert db.query(JournalEntry).count() == journal_count_before
    finally:
        app.dependency_overrides.clear()


def test_member_cannot_update_own_good_valuation_via_api(db):
    from app.models import MemberGood, MemberGoodValuation
    from app.services.member_good import add_member_good

    committee = create_committee(db, name="Member Good Valuation Auth Committee")
    member = _member(
        db,
        committee,
        name="Member Good Valuation Auth Member",
        username="member_good_valuation_auth_member",
    )
    admin = _admin_for(
        db, committee, username="member_good_valuation_test_admin"
    )
    from app.models import ContributionRate
    from app.services.contribution import record_contribution

    db.add(
        ContributionRate(
            committee_id=committee.id,
            amount=100,
            effective_from=date(2026, 1, 1),
        )
    )
    db.commit()
    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 1, 2),
    )
    db.commit()
    good = add_member_good(
        db,
        member_id=member.id,
        name="Existing Test Good",
        purchase_date=date(2026, 1, 3),
        purchase_price=100,
    )
    db.commit()
    db.add(
        UserCommitteeAccess(
            user_id=member.user_id,
            committee_id=committee.id,
            granted_by_user_id=admin.id,
            is_active=True,
            is_admin=False,
        )
    )
    db.commit()

    good_id = good.id
    valuation_count_before = db.query(MemberGoodValuation).filter_by(
        good_id=good_id
    ).count()
    member_user = db.get(User, member.user_id)
    client = _client_as(db, member_user)

    try:
        response = client.patch(
            f"/members/goods/{good_id}/value",
            json={
                "valuation_date": "2026-10-13",
                "new_value": 1,
            },
        )

        db.refresh(good)
        assert response.status_code == 404
        assert good.current_value == 100
        assert db.query(MemberGoodValuation).filter_by(
            good_id=good_id
        ).count() == valuation_count_before
    finally:
        app.dependency_overrides.clear()
