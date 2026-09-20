import getpass

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.services.auth import hash_password


def bootstrap_super_admin(
    db: Session,
    username: str,
    password: str,
    confirmation: str,
) -> None:
    if db.query(User).first() is not None:
        raise SystemExit(
            "Bootstrap refused: users already exist. "
            "Use the existing Super Admin account to create users."
        )

    username = username.strip()
    if not username:
        raise SystemExit("Username cannot be empty.")

    if not password:
        raise SystemExit("Password cannot be empty.")

    if password != confirmation:
        raise SystemExit("Passwords do not match.")

    user = User(
        username=username,
        password_hash=hash_password(password),
        role=UserRole.SUPER_ADMIN.value,
        is_active=True,
    )

    db.add(user)
    db.commit()


def main() -> None:
    db = SessionLocal()

    try:
        if db.query(User).first() is not None:
            raise SystemExit(
                "Bootstrap refused: users already exist. "
                "Use the existing Super Admin account to create users."
            )

        username = input("Initial Super Admin username: ").strip()
        password = getpass.getpass("Initial Super Admin password: ")
        confirmation = getpass.getpass("Confirm password: ")

        bootstrap_super_admin(
            db,
            username,
            password,
            confirmation,
        )

        print(f"Super Admin '{username}' created successfully.")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
