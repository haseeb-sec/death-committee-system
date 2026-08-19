from datetime import date

from fastapi.testclient import TestClient

from app.api.dependencies import get_db
from app.api.auth import get_current_user
from app.main import app
from app.models import (
    Account,
    AccountType,
    Committee,
    ContributionRate,
    User,
    UserCommitteeAccess,
    UserRole,
)


def test_create_settlement_api(db):
    committee = Committee(
        name="API Settlement Committee",
        is_active=True,
    )
    db.add(committee)
    db.flush()

    cash_account = Account(
        name=f"Cash: {committee.name}",
        account_type=AccountType.CASH,
        committee_id=committee.id,
    )

    db.add(cash_account)

    settlement_expense_account = Account(
        name=f"Settlement Expense: {committee.name}",
        account_type=AccountType.EXPENSE,
        committee_id=committee.id,
    )

    db.add(settlement_expense_account)

    from app.models import Member

    member = Member(
        committee_id=committee.id,
        name="API Member",
        joined_on=date(2026, 1, 1),
        is_active=True,
    )

    db.add(member)
    db.flush()

    member_account = Account(
        name=f"Member: {member.name}",
        account_type=AccountType.MEMBER,
        committee_id=committee.id,
        member_id=member.id,
    )

    db.add(member_account)

    rate = ContributionRate(
        committee_id=committee.id,
        amount=30000,
        effective_from=date(2026, 1, 1),
    )

    db.add(rate)
    db.commit()

    from app.services.contribution import record_contribution

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 8, 1),
        reference="API-AUG",
    )

    db.commit()

    test_user = User(
        username="test_admin",
        password_hash="unused",
        role=UserRole.ADMIN.value,
        is_active=True,
    )
    db.add(test_user)
    db.flush()

    db.add(
        UserCommitteeAccess(
            user_id=test_user.id,
            committee_id=committee.id,
            granted_by_user_id=test_user.id,
            is_active=True,
        )
    )
    db.commit()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    def override_get_current_user():
        return test_user

    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        client = TestClient(app)

        response = client.post(
            f"/members/{member.id}/settlement",
            json={
                "settlement_date": "2026-08-10",
            },
        )

        assert response.status_code == 200

        data = response.json()

        assert data["member_id"] == member.id
        assert data["contribution_balance"] == 30000
        assert data["asset_share"] == 0
        assert data["goods_value"] == 0
        assert data["outstanding_dues"] == 0
        assert data["gross_amount"] == 30000
        assert data["final_amount"] == 30000
        assert data["status"] == "pending"

    finally:
        app.dependency_overrides.clear()


def test_pay_settlement_api(db):
    committee = Committee(
        name="API Payment Committee",
        is_active=True,
    )
    db.add(committee)
    db.flush()

    cash_account = Account(
        name=f"Cash: {committee.name}",
        account_type=AccountType.CASH,
        committee_id=committee.id,
    )

    settlement_expense_account = Account(
        name=f"Settlement Expense: {committee.name}",
        account_type=AccountType.EXPENSE,
        committee_id=committee.id,
    )

    db.add_all([
        cash_account,
        settlement_expense_account,
    ])

    from app.models import Member

    member = Member(
        committee_id=committee.id,
        name="API Payment Member",
        joined_on=date(2026, 1, 1),
        is_active=True,
    )

    db.add(member)
    db.flush()

    member_account = Account(
        name=f"Member: {member.name}",
        account_type=AccountType.MEMBER,
        committee_id=committee.id,
        member_id=member.id,
    )

    db.add(member_account)

    rate = ContributionRate(
        committee_id=committee.id,
        amount=30000,
        effective_from=date(2026, 1, 1),
    )

    db.add(rate)
    db.commit()

    from app.services.contribution import record_contribution
    from app.services.member_settlement import settle_member

    record_contribution(
        db,
        member_id=member.id,
        contribution_date=date(2026, 8, 1),
        reference="API-PAY",
    )

    db.commit()

    settlement = settle_member(
        db,
        member_id=member.id,
        settlement_date=date(2026, 8, 10),
    )

    db.commit()

    test_user = User(
        username="test_admin",
        password_hash="unused",
        role=UserRole.ADMIN.value,
        is_active=True,
    )
    db.add(test_user)
    db.flush()

    db.add(
        UserCommitteeAccess(
            user_id=test_user.id,
            committee_id=committee.id,
            granted_by_user_id=test_user.id,
            is_active=True,
        )
    )
    db.commit()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    def override_get_current_user():
        return test_user

    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        client = TestClient(app)

        response = client.post(
            f"/members/settlement/{settlement.id}/pay",
        )

        assert response.status_code == 200

        data = response.json()

        assert data["id"] == settlement.id
        assert data["member_id"] == member.id
        assert data["final_amount"] == 30000
        assert data["status"] == "paid"

    finally:
        app.dependency_overrides.clear()
