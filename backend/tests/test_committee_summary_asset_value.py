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


def test_committee_summary_includes_total_asset_value(db):
    committee = create_committee(
        db,
        name="Summary Asset Committee",
    )
    db.flush()

    rate = ContributionRate(
        committee_id=committee.id,
        amount=50000,
        effective_from=date(2026, 1, 1),
    )
    db.add(rate)
    db.flush()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Summary Asset Member",
        joined_on=date(2026, 1, 1),
    )
    db.flush()

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 8, 17),
        reference="SUMMARY-ASSET-FUNDING",
    )
    db.flush()

    add_committee_asset(
        db,
        committee_id=committee.id,
        name="Committee Van",
        purchase_date=date(2026, 8, 18),
        purchase_price=20000,
        description="Shared transport",
    )
    db.flush()

    add_committee_asset(
        db,
        committee_id=committee.id,
        name="Committee Tent",
        purchase_date=date(2026, 8, 18),
        purchase_price=10000,
        description="Event tent",
    )
    db.commit()

    test_user = User(
        username="summary_asset_admin",
        password_hash="unused",
        role="committee_admin",
        is_active=True,
    )
    db.add(test_user)
    db.flush()

    db.add(
        UserCommitteeAccess(
            user_id=test_user.id,
            committee_id=committee.id,
            granted_by_user_id=test_user.id,
            is_active=True,
            is_admin=True,
        )
    )
    db.commit()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    def override_get_current_user():
        return test_user

    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        client = TestClient(app)

        response = client.get(f"/committees/{committee.id}/summary")

        assert response.status_code == 200

        data = response.json()

        assert data["total_asset_value"] == 30000

    finally:
        app.dependency_overrides.clear()
