from fastapi.testclient import TestClient

from app.api.dependencies import get_db
from app.main import app
from app.models import User, UserRole
from app.services.auth import hash_password


def make_super_admin(db, username="password_admin", password="old-password"):
    user = User(
        username=username,
        password_hash=hash_password(password),
        role=UserRole.SUPER_ADMIN.value,
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


def test_super_admin_can_change_own_password(db):
    user = make_super_admin(db)

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(client, user.username, "old-password")
        assert response.status_code == 200

        token = response.json()["access_token"]

        response = client.post(
            "/users/me/password",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "current_password": "old-password",
                "new_password": "new-password",
            },
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Password changed successfully"

        assert login(client, user.username, "old-password").status_code == 401
        assert login(client, user.username, "new-password").status_code == 200
    finally:
        app.dependency_overrides.clear()


def test_password_change_rejects_wrong_current_password(db):
    user = make_super_admin(db, username="wrong_current_admin")

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(client, user.username, "old-password")
        token = response.json()["access_token"]

        response = client.post(
            "/users/me/password",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "current_password": "wrong-password",
                "new_password": "new-password",
            },
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Current password is incorrect"
    finally:
        app.dependency_overrides.clear()


def test_password_change_rejects_same_password(db):
    user = make_super_admin(db, username="same_password_admin")

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(client, user.username, "old-password")
        token = response.json()["access_token"]

        response = client.post(
            "/users/me/password",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "current_password": "old-password",
                "new_password": "old-password",
            },
        )

        assert response.status_code == 400
        assert response.json()["detail"] == (
            "New password must be different from current password"
        )
    finally:
        app.dependency_overrides.clear()
