from datetime import date

from fastapi.testclient import TestClient

from app.api.dependencies import get_db
from app.main import app
from app.models import ContributionRate, User, UserCommitteeAccess, UserRole
from app.services.auth import hash_password
from app.services.committee import create_committee
from app.services.contribution import record_contribution
from app.services.member import add_member


def make_user(db, username, password, role):
    user = User(
        username=username,
        password_hash=hash_password(password),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def override_db(db):
    def _override():
        yield db

    return _override


def login(client, username, password):
    return client.post(
        "/auth/login",
        data={
            "username": username,
            "password": password,
        },
    )


def test_create_member_good_returns_qarz_breakdown(db, committee):
    admin = make_user(
        db,
        "good_api_admin",
        "admin-password",
        UserRole.COMMITTEE_ADMIN.value,
    )

    db.add(
        UserCommitteeAccess(
            user_id=admin.id,
            committee_id=committee.id,
            is_active=True,
            is_admin=True,
        )
    )
    db.commit()

    db.add(
        ContributionRate(
            committee_id=committee.id,
            amount=30000,
            effective_from=date(2026, 1, 1),
        )
    )
    db.commit()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Good API Member",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 1, 2),
    )
    db.commit()

    liquidity_member = add_member(
        db,
        committee_id=committee.id,
        name="Liquidity Member",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    record_contribution(
        db,
        member_id=liquidity_member.id,
        contribution_date=date(2026, 1, 2),
    )
    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "good_api_admin",
            "admin-password",
        )
        assert response.status_code == 200

        token = response.json()["access_token"]

        response = client.post(
            f"/members/{member.id}/goods",
            headers={
                "Authorization": f"Bearer {token}",
            },
            json={
                "name": "Committee-Funded Laptop",
                "purchase_date": "2026-01-03",
                "purchase_price": 50000,
                "description": "Qarz test good",
            },
        )

        assert response.status_code == 200

        data = response.json()

        assert data["purchase_price"] == 50000
        assert data["current_value"] == 50000
        assert data["member_funded_amount"] == 30000
        assert data["qarz_e_hasana_amount"] == 20000

    finally:
        app.dependency_overrides.clear()


def test_create_member_good_returns_zero_qarz_when_fully_funded(
    db,
    committee,
):
    admin = make_user(
        db,
        "good_api_full",
        "admin-password",
        UserRole.COMMITTEE_ADMIN.value,
    )

    db.add(
        UserCommitteeAccess(
            user_id=admin.id,
            committee_id=committee.id,
            is_active=True,
            is_admin=True,
        )
    )
    db.commit()

    db.add(
        ContributionRate(
            committee_id=committee.id,
            amount=30000,
            effective_from=date(2026, 1, 1),
        )
    )
    db.commit()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Fully Funded Member",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 1, 2),
    )
    db.commit()

    liquidity_member = add_member(
        db,
        committee_id=committee.id,
        name="Liquidity Member",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    record_contribution(
        db,
        member_id=liquidity_member.id,
        contribution_date=date(2026, 1, 2),
    )
    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "good_api_full",
            "admin-password",
        )
        assert response.status_code == 200

        token = response.json()["access_token"]

        response = client.post(
            f"/members/{member.id}/goods",
            headers={
                "Authorization": f"Bearer {token}",
            },
            json={
                "name": "Fully Funded Good",
                "purchase_date": "2026-01-03",
                "purchase_price": 20000,
                "description": "Fully funded test good",
            },
        )

        assert response.status_code == 200

        data = response.json()

        assert data["purchase_price"] == 20000
        assert data["member_funded_amount"] == 20000
        assert data["qarz_e_hasana_amount"] == 0

    finally:
        app.dependency_overrides.clear()
