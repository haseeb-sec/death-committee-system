from app.db.session import SessionLocal
from app.models import User, UserRole
from app.services.auth import hash_password

username = input("Admin username: ").strip()
password = input("Admin password: ")

db = SessionLocal()

try:
    existing = db.query(User).filter(User.username == username).first()

    if existing:
        print("ERROR: Username already exists.")
    else:
        user = User(
            username=username,
            password_hash=hash_password(password),
            role=UserRole.SUPER_ADMIN.value,
            is_active=True,
        )
        db.add(user)
        db.commit()
        print("SUCCESS: Super Admin created.")
finally:
    db.close()
