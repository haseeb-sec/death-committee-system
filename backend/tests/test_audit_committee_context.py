from datetime import date

from fastapi.testclient import TestClient

from app.api.auth import get_db
from app.api.dependencies import get_db as get_db_dep
from app.main import app
from app.models import (
    AuditLog,
    Committee,
    User,
    UserCommitteeAccess,
    UserRole,
)
from app.services.auth import hash_password
from app.services.committee import create_committee


def _override_db(app_, db):
    def override():
        yield db

    app_.dependency_overrides[get_db] = override
    app_.dependency_overrides[get_db_dep] = override


def _super_admin(db, *, username):
    user = User(
        username=username,
        password_hash=hash_password("password"),
        role=UserRole.SUPER_ADMIN.value,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _committee_admin_for(db, committee, *, username):
    admin = User(
        username=username,
        password_hash=hash_password("password"),
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
    db.refresh(admin)
    return admin


def test_member_creation_audit_records_correct_committee_id(db):
    committee = create_committee(db, name="Audit Committee A")
    db.commit()

    admin = _committee_admin_for(db, committee, username="audit_member_admin")

    _override_db(app, db)

    try:
        client = TestClient(app)

        login = client.post(
            "/auth/login",
            data={"username": "audit_member_admin", "password": "password"},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]

        response = client.post(
            "/members",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "committee_id": committee.id,
                "username": "audited_member",
                "password": "password",
                "name": "Audited Member",
                "joined_on": "2026-01-01",
            },
        )

        assert response.status_code == 200
        member_id = response.json()["id"]

        audit = (
            db.query(AuditLog)
            .filter(
                AuditLog.action == "create",
                AuditLog.entity_type == "member",
                AuditLog.entity_id == member_id,
            )
            .first()
        )

        assert audit is not None
        assert audit.committee_id == committee.id

    finally:
        app.dependency_overrides.clear()


def test_login_audit_has_null_committee_id(db):
    user = _super_admin(db, username="platform_level_user")

    _override_db(app, db)

    try:
        client = TestClient(app)

        response = client.post(
            "/auth/login",
            data={"username": "platform_level_user", "password": "password"},
        )
        assert response.status_code == 200

        audit = (
            db.query(AuditLog)
            .filter(
                AuditLog.user_id == user.id,
                AuditLog.action == "login",
            )
            .first()
        )

        assert audit is not None
        assert audit.committee_id is None

    finally:
        app.dependency_overrides.clear()


def test_committee_admin_cannot_list_audit_logs_of_another_committee(db):
    committee_a = create_committee(db, name="Audit Isolation Committee A")
    committee_b = create_committee(db, name="Audit Isolation Committee B")
    db.commit()

    admin_a = _committee_admin_for(
        db, committee_a, username="isolation_admin_a"
    )

    _override_db(app, db)

    try:
        client = TestClient(app)

        login = client.post(
            "/auth/login",
            data={"username": "isolation_admin_a", "password": "password"},
        )
        token = login.json()["access_token"]

        # Generate a real committee-scoped audit event for committee_a
        # so the "allowed" assertion below checks real data, not an
        # empty result set.
        create_response = client.post(
            "/members",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "committee_id": committee_a.id,
                "username": "isolation_test_member",
                "password": "password",
                "name": "Isolation Test Member",
                "joined_on": "2026-01-01",
            },
        )
        assert create_response.status_code == 200

        # Denied: another committee entirely
        response = client.get(
            "/audit-logs",
            headers={"Authorization": f"Bearer {token}"},
            params={"committee_id": committee_b.id},
        )
        assert response.status_code == 404

        # Denied: no committee_id at all (would imply platform-wide access)
        response = client.get(
            "/audit-logs",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403

        # Allowed: their own committee
        response = client.get(
            "/audit-logs",
            headers={"Authorization": f"Bearer {token}"},
            params={"committee_id": committee_a.id},
        )
        assert response.status_code == 200

        rows = response.json()
        assert len(rows) > 0
        assert all(row["committee_id"] == committee_a.id for row in rows)

    finally:
        app.dependency_overrides.clear()


def test_super_admin_can_list_all_and_filter_by_committee(db):
    committee_a = create_committee(db, name="Audit SuperAdmin Committee A")
    committee_b = create_committee(db, name="Audit SuperAdmin Committee B")
    db.commit()

    super_admin = _super_admin(db, username="audit_super_admin")

    admin_a = _committee_admin_for(
        db, committee_a, username="superadmin_scope_admin_a"
    )
    admin_b = _committee_admin_for(
        db, committee_b, username="superadmin_scope_admin_b"
    )

    _override_db(app, db)

    try:
        client = TestClient(app)

        # Generate one real committee-scoped audit event per committee,
        # so the filter assertions below are checking real data rather
        # than trivially passing on an empty result set.
        for username, committee, member_username in (
            ("superadmin_scope_admin_a", committee_a, "member_in_committee_a"),
            ("superadmin_scope_admin_b", committee_b, "member_in_committee_b"),
        ):
            login = client.post(
                "/auth/login",
                data={"username": username, "password": "password"},
            )
            member_token = login.json()["access_token"]

            create_response = client.post(
                "/members",
                headers={"Authorization": f"Bearer {member_token}"},
                json={
                    "committee_id": committee.id,
                    "username": member_username,
                    "password": "password",
                    "name": member_username,
                    "joined_on": "2026-01-01",
                },
            )
            assert create_response.status_code == 200

        login = client.post(
            "/auth/login",
            data={"username": "audit_super_admin", "password": "password"},
        )
        token = login.json()["access_token"]

        response = client.get(
            "/audit-logs",
            headers={"Authorization": f"Bearer {token}"},
            params={"committee_id": committee_a.id},
        )
        assert response.status_code == 200

        rows = response.json()
        assert len(rows) > 0
        assert all(row["committee_id"] == committee_a.id for row in rows)
        assert not any(row["committee_id"] == committee_b.id for row in rows)

        response = client.get(
            "/audit-logs",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200

        all_rows = response.json()
        committee_ids_seen = {row["committee_id"] for row in all_rows}

        assert committee_a.id in committee_ids_seen
        assert committee_b.id in committee_ids_seen
        assert None in committee_ids_seen

    finally:
        app.dependency_overrides.clear()


def test_member_cannot_list_audit_logs_at_all(db):
    committee = create_committee(db, name="Audit Member Blocked Committee")
    db.commit()

    member_user = User(
        username="blocked_member_user",
        password_hash=hash_password("password"),
        role=UserRole.MEMBER.value,
        is_active=True,
    )
    db.add(member_user)
    db.commit()

    _override_db(app, db)

    try:
        client = TestClient(app)

        login = client.post(
            "/auth/login",
            data={"username": "blocked_member_user", "password": "password"},
        )
        token = login.json()["access_token"]

        response = client.get(
            "/audit-logs",
            headers={"Authorization": f"Bearer {token}"},
            params={"committee_id": committee.id},
        )
        assert response.status_code == 403

    finally:
        app.dependency_overrides.clear()
