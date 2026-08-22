from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.api.dependencies import get_db
from app.api.users import password_reset_attempts
from app.main import app
from app.models import User, UserRole
from app.services.auth import (
    create_password_reset_token,
    hash_password,
    hash_password_reset_token,
)


def override_db(db):
    def _override():
        yield db

    return _override


def make_client(db):
    app.dependency_overrides[get_db] = override_db(db)
    return TestClient(app)


def make_user(db, username="reset_user", password="old-password"):
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


def issue_token(user, db, expires_minutes=15):
    token = create_password_reset_token()
    user.password_reset_token_hash = hash_password_reset_token(token)
    user.password_reset_expires_at = (
        datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    )
    db.commit()
    return token


def test_password_reset_succeeds_and_token_is_single_use(db):
    client = make_client(db)
    try:
        user = make_user(db)
        token = issue_token(user, db)

        response = client.post(
            "/users/password-reset",
            json={
                "token": token,
                "new_password": "new-secure-password",
            },
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Password reset successfully"

        db.refresh(user)
        assert user.password_reset_token_hash is None
        assert user.password_reset_expires_at is None

        second_response = client.post(
            "/users/password-reset",
            json={
                "token": token,
                "new_password": "another-secure-password",
            },
        )

        assert second_response.status_code == 400
        assert "Invalid or expired" in second_response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_password_reset_rejects_expired_token(db):
    client = make_client(db)
    try:
        user = make_user(db, username="expired_reset_user")
        token = issue_token(user, db, expires_minutes=-1)

        response = client.post(
            "/users/password-reset",
            json={
                "token": token,
                "new_password": "new-secure-password",
            },
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid or expired password reset token"
    finally:
        app.dependency_overrides.clear()


def test_password_reset_rejects_short_password(db):
    client = make_client(db)
    try:
        user = make_user(db, username="short_password_user")
        token = issue_token(user, db)

        response = client.post(
            "/users/password-reset",
            json={
                "token": token,
                "new_password": "short",
            },
        )

        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_password_reset_rate_limit(db):
    client = make_client(db)
    try:
        make_user(db, username="rate_limit_user")
        password_reset_attempts.clear()

        for _ in range(5):
            response = client.post(
                "/users/password-reset",
                json={
                    "token": "definitely-invalid-reset-token",
                    "new_password": "new-secure-password",
                },
            )
            assert response.status_code == 400

        response = client.post(
            "/users/password-reset",
            json={
                "token": "definitely-invalid-reset-token",
                "new_password": "new-secure-password",
            },
        )

        assert response.status_code == 429
        assert "Too many password reset attempts" in response.json()["detail"]
    finally:
        password_reset_attempts.clear()
        app.dependency_overrides.clear()
