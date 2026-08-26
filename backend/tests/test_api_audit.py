from app.models import UserCommitteeAccess
from app.services.committee import create_committee
from fastapi.testclient import TestClient

from app.api.auth import get_db
from app.main import app
from app.models import AuditLog, User, UserRole
from app.services.auth import hash_password


def test_super_admin_committee_creation_creates_audit_log(db):
    admin = User(
        username="audit_admin",
        password_hash=hash_password("audit-password"),
        role=UserRole.SUPER_ADMIN.value,
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
        role=UserRole.COMMITTEE_ADMIN.value,
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

        super_admin = User(
            username="close_super_admin",
            password_hash=hash_password("close-super-password"),
            role=UserRole.SUPER_ADMIN.value,
            is_active=True,
        )
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)

        committee = create_committee(db, name="Committee To Close")
        db.commit()
        db.refresh(committee)
        committee_id = committee.id

        access = UserCommitteeAccess(
            user_id=admin.id,
            committee_id=committee_id,
            granted_by_user_id=super_admin.id,
            is_active=True,
            is_admin=True,
        )
        db.add(access)
        db.commit()

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

def test_admin_can_create_death_support_and_receive_full_response(db):
    from datetime import date

    from app.api.dependencies import get_db
    from app.models import Committee, ContributionRate, UserRole
    from app.services.contribution import record_contribution
    from app.services.member import add_member

    admin = User(
        username="death_support_api_admin",
        password_hash=hash_password("death-support-api-password"),
        role=UserRole.COMMITTEE_ADMIN.value,
        is_active=True,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    committee = create_committee(
        db,
        name="Death Support API Committee",
    )
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
    db.flush()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Death Support API Member",
        joined_on=date(2026, 8, 17),
    )
    db.flush()

    rate = ContributionRate(
        committee_id=committee.id,
        amount=70000,
        effective_from=date(2026, 8, 17),
    )
    db.add(rate)
    db.flush()

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 8, 17),
        reference="API-DEATH-SUPPORT-CONTRIBUTION",
    )
    db.commit()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)

        login_response = client.post(
            "/auth/login",
            data={
                "username": "death_support_api_admin",
                "password": "death-support-api-password",
            },
        )

        assert login_response.status_code == 200

        token = login_response.json()["access_token"]

        response = client.post(
            f"/members/{member.id}/death-support",
            headers={
                "Authorization": f"Bearer {token}",
            },
            json={
                "beneficiary_name": "API Test Beneficiary",
                "amount": 20000,
                "support_date": "2026-08-17",
                "reference": "API-DEATH-SUPPORT",
            },
        )

        assert response.status_code == 200

        data = response.json()

        assert data["id"] > 0
        assert data["committee_id"] == committee.id
        assert data["member_id"] == member.id
        assert data["beneficiary_name"] == "API Test Beneficiary"
        assert data["amount"] == 20000
        assert data["member_funded_amount"] == 20000
        assert data["qarz_e_hasana_amount"] == 0
        assert data["support_date"] == "2026-08-17"
        assert data["reference"] == "API-DEATH-SUPPORT"

    finally:
        app.dependency_overrides.clear()

def test_member_financial_summary_returns_due_breakdown(db):
    from datetime import date

    from app.api.dependencies import get_db
    from app.models import Committee, ContributionRate, MemberDue, UserCommitteeAccess
    from app.services.member import add_member

    admin = User(
        username="financial_summary_api_admin",
        password_hash=hash_password("financial-summary-api-password"),
        role=UserRole.COMMITTEE_ADMIN.value,
        is_active=True,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    committee = create_committee(
        db,
        name="Financial Summary API Committee",
    )
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
    db.flush()

    member = add_member(
        db,
        committee_id=committee.id,
        name="Financial Summary API Member",
        joined_on=date(2026, 8, 17),
    )
    db.flush()

    db.add_all(
        [
            MemberDue(
                committee_id=committee.id,
                member_id=member.id,
                amount=5000,
                paid_amount=1000,
                due_date=date(2026, 8, 20),
                description="Ordinary due",
                due_type="ordinary",
            ),
            MemberDue(
                committee_id=committee.id,
                member_id=member.id,
                amount=12000,
                paid_amount=2000,
                due_date=date(2026, 8, 21),
                description="Qarz-e-Hasana",
                due_type="qarz_e_hasana",
            ),
        ]
    )
    db.commit()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)

        login_response = client.post(
            "/auth/login",
            data={
                "username": "financial_summary_api_admin",
                "password": "financial-summary-api-password",
            },
        )

        assert login_response.status_code == 200

        token = login_response.json()["access_token"]

        response = client.get(
            f"/members/{member.id}/financial-summary",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert response.status_code == 200

        data = response.json()

        assert data["ordinary_dues"] == 4000
        assert data["qarz_e_hasana_dues"] == 10000
        assert data["outstanding_dues"] == 14000

    finally:
        app.dependency_overrides.clear()
