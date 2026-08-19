from fastapi.testclient import TestClient

from app.api.auth import get_db
from app.main import app
from app.models import AuditLog, User, UserRole
from app.services.auth import hash_password


def test_authenticated_committee_creation_creates_audit_log(db):
    admin = User(
        username="audit_admin",
        password_hash=hash_password("audit-password"),
        role=UserRole.ADMIN.value,
        is_active=True,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)

        login_response = client.post(
            "/auth/login",
            data={
                "username": "audit_admin",
                "password": "audit-password",
            },
        )

        assert login_response.status_code == 200

        token = login_response.json()["access_token"]

        response = client.post(
            "/committees",
            headers={
                "Authorization": f"Bearer {token}",
            },
            json={
                "name": "Audited Committee",
            },
        )

        assert response.status_code == 200

        committee_id = response.json()["id"]

        audit = (
            db.query(AuditLog)
            .filter(
                AuditLog.user_id == admin.id,
                AuditLog.action == "create",
                AuditLog.entity_type == "committee",
                AuditLog.entity_id == committee_id,
            )
            .first()
        )

        assert audit is not None
        assert audit.description == "Created committee 'Audited Committee'"

    finally:
        app.dependency_overrides.clear()


def test_admin_can_close_committee_and_audit_it(db):
    admin = User(
        username="close_admin",
        password_hash=hash_password("close-password"),
        role=UserRole.ADMIN.value,
        is_active=True,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)

        login_response = client.post(
            "/auth/login",
            data={
                "username": "close_admin",
                "password": "close-password",
            },
        )

        assert login_response.status_code == 200

        token = login_response.json()["access_token"]

        create_response = client.post(
            "/committees",
            headers={
                "Authorization": f"Bearer {token}",
            },
            json={
                "name": "Committee To Close",
            },
        )

        assert create_response.status_code == 200

        committee_id = create_response.json()["id"]

        close_response = client.post(
            f"/committees/{committee_id}/close",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert close_response.status_code == 200

        data = close_response.json()

        assert data["id"] == committee_id
        assert data["name"] == "Committee To Close"
        assert data["is_active"] is False

        audit = (
            db.query(AuditLog)
            .filter(
                AuditLog.user_id == admin.id,
                AuditLog.action == "close",
                AuditLog.entity_type == "committee",
                AuditLog.entity_id == committee_id,
            )
            .first()
        )

        assert audit is not None
        assert audit.description == "Closed committee Committee To Close"

    finally:
        app.dependency_overrides.clear()
