from datetime import date

from fastapi.testclient import TestClient

from app.api.auth import get_current_user
from app.api.dependencies import get_db
from app.main import app
from app.models import MemberDue, User, UserCommitteeAccess
from app.services.committee import create_committee
from app.services.member import add_member


def _admin_for(db, committee, *, username):
    admin = User(
        username=username,
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
    return admin


def test_member_cannot_create_own_due(db):
    committee = create_committee(
        db,
        name="Due Creation Auth Committee",
    )
    db.flush()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Due Creation Auth Member",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    member_user = db.get(User, member.user_id)

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    def override_get_current_user():
        return member_user

    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        client = TestClient(app)

        response = client.post(
            f"/members/{member.id}/dues",
            json={
                "amount": 5000,
                "due_date": "2026-08-20",
                "description": "Self-created due",
            },
        )

        assert response.status_code == 404

        assert (
            db.query(MemberDue)
            .filter(MemberDue.member_id == member.id)
            .count()
            == 0
        )

    finally:
        app.dependency_overrides.clear()


def test_committee_admin_can_create_due_via_api(db):
    committee = create_committee(
        db,
        name="Due Creation Admin Committee",
    )
    db.flush()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Due Creation Admin Member",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    admin = _admin_for(db, committee, username="due_creation_admin")

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    def override_get_current_user():
        return admin

    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        client = TestClient(app)

        response = client.post(
            f"/members/{member.id}/dues",
            json={
                "amount": 5000,
                "due_date": "2026-08-20",
                "description": "Admin-created due",
            },
        )

        assert response.status_code == 200
        assert response.json()["amount"] == 5000

    finally:
        app.dependency_overrides.clear()
