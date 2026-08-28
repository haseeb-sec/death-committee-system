from datetime import date

from fastapi.testclient import TestClient

from app.api.dependencies import get_db
from app.api.auth import get_current_user
from app.main import app
from app.models import (
    Account,
    AccountType,
    Committee,
    ContributionRate,
    Member,
    User,
    UserCommitteeAccess,
    UserRole,
)
from app.services.contribution import record_contribution


def _build_committee_with_member(db, *, committee_name, member_name, rate_amount=30000):
    committee = Committee(
        name=committee_name,
        is_active=True,
    )
    db.add(committee)
    db.flush()

    cash_account = Account(
        name=f"Cash: {committee.name}",
        account_type=AccountType.CASH,
        committee_id=committee.id,
    )
    db.add(cash_account)

    member_user = User(
        username=f"user_{member_name.lower().replace(' ', '_')}",
        password_hash="unused",
        role=UserRole.MEMBER.value,
        is_active=True,
    )
    db.add(member_user)
    db.flush()

    member = Member(
        user_id=member_user.id,
        committee_id=committee.id,
        name=member_name,
        joined_on=date(2026, 1, 1),
        is_active=True,
    )
    db.add(member)
    db.flush()

    member_account = Account(
        name=f"Member: {member.name}",
        account_type=AccountType.MEMBER,
        committee_id=committee.id,
        member_id=member.id,
    )
    db.add(member_account)

    rate = ContributionRate(
        committee_id=committee.id,
        amount=rate_amount,
        effective_from=date(2026, 1, 1),
    )
    db.add(rate)

    db.commit()

    return committee, member


def _admin_for_committee(db, committee, *, username):
    admin_user = User(
        username=username,
        password_hash="unused",
        role=UserRole.COMMITTEE_ADMIN.value,
        is_active=True,
    )
    db.add(admin_user)
    db.flush()

    db.add(
        UserCommitteeAccess(
            user_id=admin_user.id,
            committee_id=committee.id,
            granted_by_user_id=admin_user.id,
            is_active=True,
            is_admin=True,
        )
    )
    db.commit()

    return admin_user


def test_list_member_contributions_api(db):
    committee, member = _build_committee_with_member(
        db,
        committee_name="Contribution History Committee",
        member_name="History Member",
    )

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 3, 1),
        reference="MAR",
    )
    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 4, 1),
        reference="APR",
    )
    db.commit()

    admin = _admin_for_committee(
        db,
        committee,
        username="history_admin",
    )

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: admin

    try:
        client = TestClient(app)

        response = client.get(f"/members/{member.id}/contributions")

        assert response.status_code == 200

        data = response.json()

        assert len(data) == 2
        assert data[0]["reference"] == "MAR"
        assert data[0]["amount"] == 30000
        assert data[1]["reference"] == "APR"
        assert data[1]["amount"] == 30000

    finally:
        app.dependency_overrides.clear()


def test_member_contribution_total_api(db):
    committee, member = _build_committee_with_member(
        db,
        committee_name="Contribution Total Committee",
        member_name="Total Member",
    )

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 3, 1),
    )
    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 4, 1),
    )
    db.commit()

    admin = _admin_for_committee(
        db,
        committee,
        username="total_admin",
    )

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: admin

    try:
        client = TestClient(app)

        response = client.get(
            f"/members/{member.id}/contributions/total"
        )

        assert response.status_code == 200

        data = response.json()

        assert data["member_id"] == member.id
        assert data["total_contributed"] == 60000

    finally:
        app.dependency_overrides.clear()


def test_committee_monthly_contribution_status_api(db):
    committee, paid_member = _build_committee_with_member(
        db,
        committee_name="Monthly Status Committee",
        member_name="Paid Member",
    )

    unpaid_user = User(
        username="unpaid_user",
        password_hash="unused",
        role=UserRole.MEMBER.value,
        is_active=True,
    )
    db.add(unpaid_user)
    db.flush()

    unpaid_member = Member(
        user_id=unpaid_user.id,
        committee_id=committee.id,
        name="Unpaid Member",
        joined_on=date(2026, 1, 1),
        is_active=True,
    )
    db.add(unpaid_member)
    db.flush()

    unpaid_account = Account(
        name=f"Member: {unpaid_member.name}",
        account_type=AccountType.MEMBER,
        committee_id=committee.id,
        member_id=unpaid_member.id,
    )
    db.add(unpaid_account)
    db.commit()

    record_contribution(
        db,
        member_id=paid_member.id,
        contribution_date=date(2026, 5, 10),
    )
    db.commit()

    admin = _admin_for_committee(
        db,
        committee,
        username="monthly_status_admin",
    )

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: admin

    try:
        client = TestClient(app)

        response = client.get(
            f"/committees/{committee.id}/contributions/status",
            params={"year": 2026, "month": 5},
        )

        assert response.status_code == 200

        data = response.json()

        by_member = {row["member_id"]: row for row in data}

        assert by_member[paid_member.id]["status"] == "paid"
        assert by_member[paid_member.id]["paid_amount"] == 30000
        assert by_member[unpaid_member.id]["status"] == "not_paid"
        assert by_member[unpaid_member.id]["paid_amount"] == 0

    finally:
        app.dependency_overrides.clear()


def test_member_cannot_view_contributions_of_another_committee(db):
    committee_a, member_a = _build_committee_with_member(
        db,
        committee_name="Contribution IDOR Committee A",
        member_name="Committee A Member",
    )
    committee_b, _ = _build_committee_with_member(
        db,
        committee_name="Contribution IDOR Committee B",
        member_name="Committee B Member",
    )

    outsider = _admin_for_committee(
        db,
        committee_b,
        username="idor_admin_b",
    )

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: outsider

    try:
        client = TestClient(app)

        response = client.get(f"/members/{member_a.id}/contributions")

        assert response.status_code == 404

        response = client.get(
            f"/committees/{committee_a.id}/contributions/status",
            params={"year": 2026, "month": 5},
        )

        assert response.status_code == 404

    finally:
        app.dependency_overrides.clear()
