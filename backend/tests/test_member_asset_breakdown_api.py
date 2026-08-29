from datetime import date

from fastapi.testclient import TestClient

from app.api.auth import get_current_user
from app.api.dependencies import get_db
from app.main import app
from app.models import ContributionRate, User, UserCommitteeAccess
from app.services.committee import create_committee
from app.services.committee_asset import add_committee_asset
from app.services.contribution import record_contribution
from app.services.member import add_member


def test_member_asset_breakdown_reflects_ownership(db):
    committee = create_committee(
        db,
        name="Asset Breakdown Committee",
    )
    db.flush()

    rate = ContributionRate(
        committee_id=committee.id,
        amount=50000,
        effective_from=date(2026, 1, 1),
    )
    db.add(rate)
    db.flush()

    member_one = add_member(
        db,
        committee_id=committee.id,
        name="Breakdown Member One",
        joined_on=date(2026, 1, 1),
    )
    db.flush()

    member_two = add_member(
        db,
        committee_id=committee.id,
        name="Breakdown Member Two",
        joined_on=date(2026, 1, 1),
    )
    db.flush()

    for member in (member_one, member_two):
        record_contribution(
            db,
            member_id=member.id,
            contribution_date=date(2026, 8, 17),
            reference=f"FUNDING-{member.id}",
        )
    db.flush()

    asset = add_committee_asset(
        db,
        committee_id=committee.id,
        name="Breakdown Asset Van",
        purchase_date=date(2026, 8, 18),
        purchase_price=20000,
        description="Shared transport",
    )
    db.commit()

    admin = User(
        username="asset_breakdown_admin",
        password_hash="unused",
        role="committee_admin",
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

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    def override_get_current_user():
        return admin

    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        client = TestClient(app)

        response = client.get(
            f"/members/{member_one.id}/asset-breakdown"
        )

        assert response.status_code == 200

        data = response.json()

        assert len(data) == 1
        entry = data[0]

        assert entry["asset_id"] == asset.id
        assert entry["asset_name"] == "Breakdown Asset Van"
        assert entry["current_value"] == 20000

        # Two equal owners: share should split evenly.
        assert entry["share_value"] == 10000

        response_two = client.get(
            f"/members/{member_two.id}/asset-breakdown"
        )
        assert response_two.status_code == 200
        data_two = response_two.json()

        # sum(all member shares) == asset.current_value
        assert (
            data[0]["share_value"] + data_two[0]["share_value"]
            == asset.current_value
        )

    finally:
        app.dependency_overrides.clear()


def test_asset_breakdown_denied_for_other_committee_member(db):
    committee_a = create_committee(
        db,
        name="Asset Breakdown Isolation A",
    )
    committee_b = create_committee(
        db,
        name="Asset Breakdown Isolation B",
    )
    db.flush()

    member_a = add_member(
        db,
        committee_id=committee_a.id,
        name="Isolation Member A",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    admin_b = User(
        username="asset_breakdown_admin_b",
        password_hash="unused",
        role="committee_admin",
        is_active=True,
    )
    db.add(admin_b)
    db.flush()

    db.add(
        UserCommitteeAccess(
            user_id=admin_b.id,
            committee_id=committee_b.id,
            granted_by_user_id=admin_b.id,
            is_active=True,
            is_admin=True,
        )
    )
    db.commit()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    def override_get_current_user():
        return admin_b

    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        client = TestClient(app)

        response = client.get(
            f"/members/{member_a.id}/asset-breakdown"
        )

        assert response.status_code == 404

    finally:
        app.dependency_overrides.clear()
