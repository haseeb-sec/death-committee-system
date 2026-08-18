from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.api.dependencies import get_db
from app.main import app
from app.models import Committee, User, UserRole
from app.services.auth import create_access_token, hash_password


def make_user(db, username, password, role, is_active=True):
    user = User(
        username=username,
        password_hash=hash_password(password),
        role=role,
        is_active=is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def override_db(db):
    def _override():
        yield db

    return _override


def client_for(db):
    app.dependency_overrides[get_db] = override_db(db)
    return TestClient(app)


def login(client, username, password):
    return client.post(
        "/auth/login",
        data={
            "username": username,
            "password": password,
        },
    )


def test_unauthenticated_read_requires_login(db):
    committee = Committee(
        name="Permission Test Committee",
        is_active=True,
    )
    db.add(committee)
    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = client.get(
            f"/committees/{committee.id}/summary",
        )

        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


def test_viewer_can_read_authenticated_endpoint(db):
    viewer = make_user(
        db,
        "viewer_read",
        "viewer-password",
        UserRole.VIEWER.value,
    )

    committee = Committee(
        name="Viewer Read Committee",
        is_active=True,
    )
    db.add(committee)
    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "viewer_read",
            "viewer-password",
        )

        assert response.status_code == 200

        token = response.json()["access_token"]

        response = client.get(
            f"/committees/{committee.id}/summary",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert response.status_code != 401
        assert response.status_code != 403
    finally:
        app.dependency_overrides.clear()


def test_viewer_cannot_create_committee(db):
    make_user(
        db,
        "viewer_write",
        "viewer-password",
        UserRole.VIEWER.value,
    )

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "viewer_write",
            "viewer-password",
        )

        token = response.json()["access_token"]

        response = client.post(
            "/committees",
            headers={
                "Authorization": f"Bearer {token}",
            },
            json={
                "name": "Should Not Be Created",
            },
        )

        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_admin_can_create_committee(db):
    make_user(
        db,
        "admin_write",
        "admin-password",
        UserRole.ADMIN.value,
    )

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "admin_write",
            "admin-password",
        )

        token = response.json()["access_token"]

        response = client.post(
            "/committees",
            headers={
                "Authorization": f"Bearer {token}",
            },
            json={
                "name": "Admin Committee",
            },
        )

        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()


def test_admin_cannot_manage_users(db):
    make_user(
        db,
        "admin_users",
        "admin-password",
        UserRole.ADMIN.value,
    )

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "admin_users",
            "admin-password",
        )

        token = response.json()["access_token"]

        response = client.get(
            "/users",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_super_admin_can_list_users(db):
    make_user(
        db,
        "super_users",
        "super-password",
        UserRole.SUPER_ADMIN.value,
    )

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "super_users",
            "super-password",
        )

        token = response.json()["access_token"]

        response = client.get(
            "/users",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()


def test_invalid_password_rejected(db):
    make_user(
        db,
        "bad_password",
        "correct-password",
        UserRole.VIEWER.value,
    )

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "bad_password",
            "wrong-password",
        )

        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


def test_inactive_user_cannot_login(db):
    make_user(
        db,
        "inactive_user",
        "inactive-password",
        UserRole.VIEWER.value,
        is_active=False,
    )

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "inactive_user",
            "inactive-password",
        )

        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


def test_invalid_token_rejected(db):
    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = client.get(
            "/committees/1/summary",
            headers={
                "Authorization": "Bearer definitely-invalid-token",
            },
        )

        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


def test_deactivated_user_cannot_use_existing_token(db):
    user = make_user(
        db,
        "deactivated_token",
        "token-password",
        UserRole.VIEWER.value,
    )

    token = create_access_token(
        user.id,
        user.role,
    )

    user.is_active = False
    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = client.get(
            "/committees/1/summary",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()
