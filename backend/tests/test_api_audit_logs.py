from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.api.auth import get_db
from app.main import app
from app.models import AuditLog, User, UserRole
from app.services.auth import hash_password


def _create_user(db, *, username: str, role: str) -> User:
    user = User(
        username=username,
        password_hash=hash_password("audit-log-password"),
        role=role,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def _login(client: TestClient, username: str) -> str:
    response = client.post(
        "/auth/login",
        data={
            "username": username,
            "password": "audit-log-password",
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def test_super_admin_can_list_audit_logs(db):
    admin = _create_user(
        db,
        username="audit_logs_super_admin",
        role=UserRole.SUPER_ADMIN.value,
    )

    first_log = AuditLog(
        user_id=admin.id,
        action="create",
        entity_type="committee",
        entity_id=101,
        description="Created audit committee",
    )

    second_log = AuditLog(
        user_id=admin.id,
        action="update",
        entity_type="member",
        entity_id=202,
        description="Updated audit member",
    )

    db.add_all([first_log, second_log])
    db.commit()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)
        token = _login(client, "audit_logs_super_admin")

        response = client.get(
            "/audit-logs",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200

        data = response.json()

        assert len(data) >= 2

        returned_ids = {item["id"] for item in data}

        assert first_log.id in returned_ids
        assert second_log.id in returned_ids

    finally:
        app.dependency_overrides.clear()


def test_audit_logs_can_be_filtered(db):
    admin = _create_user(
        db,
        username="audit_logs_filter_admin",
        role=UserRole.SUPER_ADMIN.value,
    )

    db.add_all(
        [
            AuditLog(
                user_id=admin.id,
                action="create",
                entity_type="committee",
                entity_id=301,
                description="Committee log",
            ),
            AuditLog(
                user_id=admin.id,
                action="update",
                entity_type="member",
                entity_id=302,
                description="Member log",
            ),
            AuditLog(
                user_id=admin.id,
                action="create",
                entity_type="committee",
                entity_id=303,
                description="Second committee log",
            ),
        ]
    )
    db.commit()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)
        token = _login(client, "audit_logs_filter_admin")

        response = client.get(
            "/audit-logs",
            params={"entity_type": "committee"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200

        data = response.json()

        assert data
        assert all(item["entity_type"] == "committee" for item in data)

        response = client.get(
            "/audit-logs",
            params={"entity_id": 302},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200

        data = response.json()

        assert len(data) == 1
        assert data[0]["entity_id"] == 302

        response = client.get(
            "/audit-logs",
            params={"user_id": admin.id},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200

        data = response.json()

        assert data
        assert all(item["user_id"] == admin.id for item in data)

    finally:
        app.dependency_overrides.clear()


def test_audit_logs_support_date_filters_and_pagination(db):
    admin = _create_user(
        db,
        username="audit_logs_date_admin",
        role=UserRole.SUPER_ADMIN.value,
    )

    now = datetime.now(timezone.utc)

    logs = [
        AuditLog(
            user_id=admin.id,
            action="create",
            entity_type="test",
            entity_id=401,
            description="Oldest",
            created_at=now - timedelta(days=2),
        ),
        AuditLog(
            user_id=admin.id,
            action="create",
            entity_type="test",
            entity_id=402,
            description="Middle",
            created_at=now - timedelta(days=1),
        ),
        AuditLog(
            user_id=admin.id,
            action="create",
            entity_type="test",
            entity_id=403,
            description="Newest",
            created_at=now,
        ),
    ]

    db.add_all(logs)
    db.commit()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)
        token = _login(client, "audit_logs_date_admin")

        response = client.get(
            "/audit-logs",
            params={
                "entity_type": "test",
                "skip": 0,
                "limit": 2,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200

        data = response.json()

        assert len(data) == 2
        assert data[0]["entity_id"] == 403
        assert data[1]["entity_id"] == 402

        start_date = (now - timedelta(days=1, hours=1)).isoformat()

        response = client.get(
            "/audit-logs",
            params={
                "entity_type": "test",
                "start_date": start_date,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200

        data = response.json()

        returned_ids = {item["entity_id"] for item in data}

        assert 402 in returned_ids
        assert 403 in returned_ids
        assert 401 not in returned_ids

    finally:
        app.dependency_overrides.clear()


def test_non_super_admin_cannot_list_audit_logs(db):
    user = _create_user(
        db,
        username="audit_logs_regular_admin",
        role=UserRole.COMMITTEE_ADMIN.value,
    )

    db.add(
        AuditLog(
            user_id=user.id,
            action="test",
            entity_type="test",
            entity_id=501,
            description="Protected audit log",
        )
    )
    db.commit()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)
        token = _login(client, "audit_logs_regular_admin")

        response = client.get(
            "/audit-logs",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403
        assert response.json()["detail"] == "Super Admin access required"

    finally:
        app.dependency_overrides.clear()


def test_unauthenticated_user_cannot_list_audit_logs(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)

        response = client.get("/audit-logs")

        assert response.status_code == 401

    finally:
        app.dependency_overrides.clear()
