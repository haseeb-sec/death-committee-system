from datetime import date

from fastapi.testclient import TestClient

from app.api.auth import get_current_user
from app.api.dependencies import get_db
from app.main import app
from app.models import AuditLog, MemberDue, User, UserCommitteeAccess
from app.services.committee import create_committee
from app.services.member import add_member


def test_paying_member_due_creates_audit_log(db):
    committee = create_committee(
        db,
        name="Due Payment Audit Committee",
    )
    db.flush()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Due Payment Audit Member",
        joined_on=date(2026, 1, 1),
    )
    db.flush()

    due = MemberDue(
        committee_id=committee.id,
        member_id=member.id,
        amount=5000,
        paid_amount=0,
        due_date=date(2026, 8, 20),
        description="Ordinary due",
        due_type="ordinary",
    )
    db.add(due)
    db.commit()
    db.refresh(due)

    admin = User(
        username="due_payment_audit_admin",
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

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    def override_get_current_user():
        return admin

    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        client = TestClient(app)

        response = client.post(
            f"/members/dues/{due.id}/pay",
            json={"amount": 2000},
        )

        assert response.status_code == 200

        audit = (
            db.query(AuditLog)
            .filter(
                AuditLog.action == "pay",
                AuditLog.entity_type == "member_due",
                AuditLog.entity_id == due.id,
            )
            .first()
        )

        assert audit is not None
        assert audit.committee_id == committee.id
        assert audit.user_id == admin.id

    finally:
        app.dependency_overrides.clear()
