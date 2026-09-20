import pytest

from app.bootstrap_admin import bootstrap_super_admin
from app.models.user import User, UserRole
from app.services.auth import verify_password


def test_bootstrap_creates_first_super_admin(db):
    bootstrap_super_admin(
        db,
        "initial-admin",
        "StrongPassword123!",
        "StrongPassword123!",
    )

    user = db.query(User).filter(User.username == "initial-admin").one()

    assert user.role == UserRole.SUPER_ADMIN.value
    assert user.is_active is True
    assert verify_password("StrongPassword123!", user.password_hash)


def test_bootstrap_refuses_when_users_already_exist(db):
    existing = User(
        username="existing-user",
        password_hash="existing-hash",
        role=UserRole.SUPER_ADMIN.value,
        is_active=True,
    )
    db.add(existing)
    db.commit()

    with pytest.raises(SystemExit, match="users already exist"):
        bootstrap_super_admin(
            db,
            "initial-admin",
            "StrongPassword123!",
            "StrongPassword123!",
        )

    assert db.query(User).count() == 1


def test_bootstrap_refuses_empty_username(db):
    with pytest.raises(SystemExit, match="Username cannot be empty"):
        bootstrap_super_admin(
            db,
            "",
            "StrongPassword123!",
            "StrongPassword123!",
        )

    assert db.query(User).count() == 0


def test_bootstrap_refuses_password_mismatch(db):
    with pytest.raises(SystemExit, match="Passwords do not match"):
        bootstrap_super_admin(
            db,
            "initial-admin",
            "Password123!",
            "DifferentPassword123!",
        )

    assert db.query(User).count() == 0
