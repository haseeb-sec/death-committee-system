from datetime import date

from fastapi.testclient import TestClient

from app.api.auth import get_current_user
from app.api.dependencies import get_db
from app.main import app
from app.models import ContributionRate, User
from app.services.committee import create_committee
from app.services.contribution import record_contribution
from app.services.member import add_member


def test_committee_asset_api_lifecycle(db):
    committee = create_committee(
        db,
        name="Asset API Committee",
    )
    db.flush()

    rate = ContributionRate(
        committee_id=committee.id,
        amount=10000,
        effective_from=date(2026, 1, 1),
    )
    db.add(rate)
    db.flush()

    members = []

    for name, reference in (
        ("API Asset Member A", "API-ASSET-A"),
        ("API Asset Member B", "API-ASSET-B"),
    ):
        member = add_member(
            db,
            committee_id=committee.id,
            name=name,
            joined_on=date(2026, 1, 1),
        )
        db.flush()

        record_contribution(
            db,
            member_id=member.id,
            contribution_date=date(2026, 8, 17),
            reference=reference,
        )
        db.flush()

        members.append(member)

    db.commit()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    def override_get_current_user():
        return User(
            id=1,
            username="test_admin",
            password_hash="unused",
            role="admin",
            is_active=True,
        )

    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        client = TestClient(app)

        response = client.post(
            f"/committees/{committee.id}/assets",
            json={
                "name": "API Test Asset",
                "purchase_date": "2026-08-17",
                "purchase_value": 10000,
                "description": "API asset test",
            },
        )

        assert response.status_code == 200

        data = response.json()

        assert data["committee_id"] == committee.id
        assert data["name"] == "API Test Asset"
        assert data["purchase_date"] == "2026-08-17"
        assert data["purchase_value"] == 10000
        assert data["current_value"] == 10000
        assert data["description"] == "API asset test"

        asset_id = data["id"]

        response = client.patch(
            f"/committees/assets/{asset_id}/value",
            json={
                "valuation_date": "2026-08-18",
                "new_value": 12000,
            },
        )

        assert response.status_code == 200

        data = response.json()

        assert data["id"] == asset_id
        assert data["purchase_value"] == 10000
        assert data["current_value"] == 12000

        response = client.get(
            f"/committees/assets/{asset_id}/valuations",
        )

        assert response.status_code == 200

        valuations = response.json()

        assert len(valuations) == 2
        assert valuations[0]["asset_id"] == asset_id
        assert valuations[0]["valuation_date"] == "2026-08-17"
        assert valuations[0]["value"] == 10000
        assert valuations[1]["valuation_date"] == "2026-08-18"
        assert valuations[1]["value"] == 12000

        response = client.get(
            f"/committees/assets/{asset_id}/participation",
        )

        assert response.status_code == 200

        participation = response.json()

        assert len(participation) == 2

        member_ids = {
            item["member_id"]
            for item in participation
        }

        assert member_ids == {
            members[0].id,
            members[1].id,
        }

        for item in participation:
            assert item["asset_id"] == asset_id
            assert item["ownership_units"] == 1
            assert item["total_units"] == 2

    finally:
        app.dependency_overrides.clear()
