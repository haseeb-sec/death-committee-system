from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.api.dependencies import get_db
from app.main import app
from app.models import Committee, ContributionRate, User, UserRole
from app.services.auth import create_access_token, hash_password
from app.services.member import add_member
from app.services.committee import create_committee


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


def test_user_cannot_access_another_users_committee(db):
    owner = make_user(
        db,
        "committee_owner",
        "owner-password",
        UserRole.ADMIN.value,
    )

    other_user = make_user(
        db,
        "committee_other",
        "other-password",
        UserRole.ADMIN.value,
    )

    committee_a = Committee(
        name="Owner Committee",
        is_active=True,
    )
    committee_b = Committee(
        name="Other Committee",
        is_active=True,
    )

    db.add_all([committee_a, committee_b])
    db.commit()

    from app.models import UserCommitteeAccess

    db.add(
        UserCommitteeAccess(
            user_id=owner.id,
            committee_id=committee_a.id,
            granted_by_user_id=owner.id,
            is_active=True,
        )
    )

    db.add(
        UserCommitteeAccess(
            user_id=other_user.id,
            committee_id=committee_b.id,
            granted_by_user_id=owner.id,
            is_active=True,
        )
    )

    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "committee_other",
            "other-password",
        )

        assert response.status_code == 200

        token = response.json()["access_token"]

        allowed = client.get(
            f"/committees/{committee_b.id}/summary",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        denied = client.get(
            f"/committees/{committee_a.id}/summary",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert allowed.status_code != 403
        assert denied.status_code == 404

    finally:
        app.dependency_overrides.clear()


def test_user_cannot_access_member_from_another_committee(db):
    owner = make_user(
        db,
        "member_owner",
        "owner-password",
        UserRole.ADMIN.value,
    )

    other_user = make_user(
        db,
        "member_other",
        "other-password",
        UserRole.ADMIN.value,
    )

    committee_a = Committee(
        name="Member Owner Committee",
        is_active=True,
    )
    committee_b = Committee(
        name="Member Other Committee",
        is_active=True,
    )
    db.add_all([committee_a, committee_b])
    db.commit()

    from app.models import UserCommitteeAccess

    db.add_all(
        [
            UserCommitteeAccess(
                user_id=owner.id,
                committee_id=committee_a.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
            UserCommitteeAccess(
                user_id=other_user.id,
                committee_id=committee_b.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
        ]
    )
    db.commit()

    member_a = add_member(
        db,
        committee_id=committee_a.id,
        name="Private Member A",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "member_other",
            "other-password",
        )

        assert response.status_code == 200

        token = response.json()["access_token"]

        response = client.get(
            f"/members/{member_a.id}/financial-summary",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert response.status_code == 404

    finally:
        app.dependency_overrides.clear()


def test_user_cannot_access_committee_asset_from_another_committee(db):
    owner = make_user(
        db,
        "asset_owner",
        "owner-password",
        UserRole.ADMIN.value,
    )

    other_user = make_user(
        db,
        "asset_other",
        "other-password",
        UserRole.ADMIN.value,
    )

    committee_a = create_committee(
        db,
        name="Asset Owner Committee",
    )
    committee_b = create_committee(
        db,
        name="Asset Other Committee",
    )
    db.commit()

    from app.models import UserCommitteeAccess

    db.add_all(
        [
            UserCommitteeAccess(
                user_id=owner.id,
                committee_id=committee_a.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
            UserCommitteeAccess(
                user_id=other_user.id,
                committee_id=committee_b.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
        ]
    )
    db.commit()

    member_a = add_member(
        db,
        committee_id=committee_a.id,
        name="Asset Owner Member",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    rate = ContributionRate(
        committee_id=committee_a.id,
        amount=1000,
        effective_from=date(2026, 1, 1),
    )
    db.add(rate)
    db.commit()

    from app.services.contribution import record_contribution

    record_contribution(
        db,
        member_id=member_a.id,
        contribution_date=date(2026, 1, 2),
    )
    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "asset_other",
            "other-password",
        )

        assert response.status_code == 200

        token = response.json()["access_token"]

        headers = {
            "Authorization": f"Bearer {token}",
        }

        response = client.post(
            f"/committees/{committee_a.id}/assets",
            headers=headers,
            json={
                "name": "Private Committee Asset",
                "purchase_date": "2026-01-02",
                "purchase_value": 500,
                "description": "Private asset",
            },
        )
        assert response.status_code == 404

    finally:
        app.dependency_overrides.clear()


def test_user_cannot_read_or_update_committee_asset_from_another_committee(db):
    owner = make_user(
        db,
        "asset_read_owner",
        "owner-password",
        UserRole.ADMIN.value,
    )

    other_user = make_user(
        db,
        "asset_read_other",
        "other-password",
        UserRole.ADMIN.value,
    )

    committee_a = create_committee(
        db,
        name="Asset Read Owner Committee",
    )
    committee_b = create_committee(
        db,
        name="Asset Read Other Committee",
    )
    db.commit()

    from app.models import UserCommitteeAccess

    db.add_all(
        [
            UserCommitteeAccess(
                user_id=owner.id,
                committee_id=committee_a.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
            UserCommitteeAccess(
                user_id=other_user.id,
                committee_id=committee_b.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
        ]
    )
    db.commit()

    member_a = add_member(
        db,
        committee_id=committee_a.id,
        name="Asset Read Owner Member",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    rate = ContributionRate(
        committee_id=committee_a.id,
        amount=10000,
        effective_from=date(2026, 1, 1),
    )
    db.add(rate)
    db.commit()

    from app.services.contribution import record_contribution
    from app.services.committee_asset import add_committee_asset

    record_contribution(
        db,
        member_id=member_a.id,
        contribution_date=date(2026, 1, 2),
    )
    db.commit()

    asset = add_committee_asset(
        db,
        committee_id=committee_a.id,
        name="Private Existing Asset",
        purchase_date=date(2026, 1, 2),
        purchase_price=5000,
        description="Private asset",
    )
    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "asset_read_other",
            "other-password",
        )

        assert response.status_code == 200

        token = response.json()["access_token"]

        headers = {
            "Authorization": f"Bearer {token}",
        }

        response = client.patch(
            f"/committees/assets/{asset.id}/value",
            headers=headers,
            json={
                "valuation_date": "2026-01-03",
                "new_value": 4000,
            },
        )
        assert response.status_code == 404

        response = client.get(
            f"/committees/assets/{asset.id}/valuations",
            headers=headers,
        )
        assert response.status_code == 404

        response = client.get(
            f"/committees/assets/{asset.id}/participation",
            headers=headers,
        )
        assert response.status_code == 404

    finally:
        app.dependency_overrides.clear()


def test_user_cannot_access_member_good_from_another_committee(db):
    owner = make_user(
        db,
        "good_owner",
        "owner-password",
        UserRole.ADMIN.value,
    )

    other_user = make_user(
        db,
        "good_other",
        "other-password",
        UserRole.ADMIN.value,
    )

    committee_a = create_committee(
        db,
        name="Good Owner Committee",
    )
    committee_b = create_committee(
        db,
        name="Good Other Committee",
    )
    db.commit()

    from app.models import UserCommitteeAccess

    db.add_all(
        [
            UserCommitteeAccess(
                user_id=owner.id,
                committee_id=committee_a.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
            UserCommitteeAccess(
                user_id=other_user.id,
                committee_id=committee_b.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
        ]
    )
    db.commit()

    member_a = add_member(
        db,
        committee_id=committee_a.id,
        name="Good Owner Member",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    rate = ContributionRate(
        committee_id=committee_a.id,
        amount=1000,
        effective_from=date(2026, 1, 1),
    )
    db.add(rate)
    db.commit()

    from app.services.contribution import record_contribution

    record_contribution(
        db,
        member_id=member_a.id,
        contribution_date=date(2026, 1, 2),
    )
    db.commit()

    from app.services.member_good import add_member_good

    good = add_member_good(
        db,
        member_id=member_a.id,
        name="Private Good",
        purchase_date=date(2026, 1, 2),
        purchase_price=100,
    )
    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "good_other",
            "other-password",
        )

        assert response.status_code == 200

        token = response.json()["access_token"]

        headers = {
            "Authorization": f"Bearer {token}",
        }

        response = client.get(
            f"/members/{member_a.id}/goods",
            headers=headers,
        )
        assert response.status_code == 404

        response = client.get(
            f"/members/{member_a.id}/goods/{good.id}/valuations",
            headers=headers,
        )
        assert response.status_code == 404

        response = client.get(
            f"/members/{member_a.id}/goods/total",
            headers=headers,
        )
        assert response.status_code == 404

        response = client.patch(
            f"/members/goods/{good.id}/value",
            headers=headers,
            json={
                "valuation_date": "2026-01-03",
                "new_value": 1,
            },
        )
        assert response.status_code == 404

    finally:
        app.dependency_overrides.clear()

def test_user_cannot_create_contribution_for_member_from_another_committee(db):
    owner = make_user(
        db,
        "contribution_owner",
        "owner-password",
        UserRole.ADMIN.value,
    )

    other_user = make_user(
        db,
        "contribution_other",
        "other-password",
        UserRole.ADMIN.value,
    )

    committee_a = create_committee(
        db,
        name="Contribution Owner Committee",
    )
    committee_b = create_committee(
        db,
        name="Contribution Other Committee",
    )
    db.commit()

    from app.models import UserCommitteeAccess

    db.add_all(
        [
            UserCommitteeAccess(
                user_id=owner.id,
                committee_id=committee_a.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
            UserCommitteeAccess(
                user_id=other_user.id,
                committee_id=committee_b.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
        ]
    )
    db.commit()

    member_a = add_member(
        db,
        committee_id=committee_a.id,
        name="Private Contribution Member",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    rate = ContributionRate(
        committee_id=committee_a.id,
        amount=1000,
        effective_from=date(2026, 1, 1),
    )
    db.add(rate)
    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "contribution_other",
            "other-password",
        )

        assert response.status_code == 200

        token = response.json()["access_token"]

        response = client.post(
            f"/members/{member_a.id}/contributions",
            headers={
                "Authorization": f"Bearer {token}",
            },
            json={
                "contribution_date": "2026-08-01",
                "reference": "UNAUTHORIZED-CONTRIBUTION",
            },
        )

        assert response.status_code == 404

    finally:
        app.dependency_overrides.clear()

def test_user_cannot_create_death_support_for_member_from_another_committee(db):
    owner = make_user(
        db,
        "death_support_owner",
        "owner-password",
        UserRole.ADMIN.value,
    )

    other_user = make_user(
        db,
        "death_support_other",
        "other-password",
        UserRole.ADMIN.value,
    )

    committee_a = create_committee(
        db,
        name="Death Support Owner Committee",
    )
    committee_b = create_committee(
        db,
        name="Death Support Other Committee",
    )
    db.commit()

    from app.models import UserCommitteeAccess

    db.add_all(
        [
            UserCommitteeAccess(
                user_id=owner.id,
                committee_id=committee_a.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
            UserCommitteeAccess(
                user_id=other_user.id,
                committee_id=committee_b.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
        ]
    )
    db.commit()

    member_a = add_member(
        db,
        committee_id=committee_a.id,
        name="Private Death Support Member",
        joined_on=date(2026, 8, 17),
    )
    db.commit()

    rate = ContributionRate(
        committee_id=committee_a.id,
        amount=70000,
        effective_from=date(2026, 8, 17),
    )
    db.add(rate)
    db.commit()

    from app.services.contribution import record_contribution

    record_contribution(
        db,
        member_id=member_a.id,
        contribution_date=date(2026, 8, 17),
        reference="DEATH-SUPPORT-TEST-CONTRIBUTION",
    )
    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "death_support_other",
            "other-password",
        )

        assert response.status_code == 200

        token = response.json()["access_token"]

        response = client.post(
            f"/members/{member_a.id}/death-support",
            headers={
                "Authorization": f"Bearer {token}",
            },
            json={
                "beneficiary_name": "Unauthorized Beneficiary",
                "amount": 20000,
                "support_date": "2026-08-17",
                "reference": "UNAUTHORIZED-DEATH-SUPPORT",
            },
        )

        assert response.status_code == 404
        assert member_a.is_active is True
        assert member_a.left_on is None

    finally:
        app.dependency_overrides.clear()


def test_user_cannot_pay_due_for_member_from_another_committee(db):
    owner = make_user(
        db,
        "due_owner",
        "owner-password",
        UserRole.ADMIN.value,
    )

    other_user = make_user(
        db,
        "due_other",
        "other-password",
        UserRole.ADMIN.value,
    )

    committee_a = create_committee(
        db,
        name="Due Owner Committee",
    )
    committee_b = create_committee(
        db,
        name="Due Other Committee",
    )
    db.commit()

    from app.models import UserCommitteeAccess

    db.add_all(
        [
            UserCommitteeAccess(
                user_id=owner.id,
                committee_id=committee_a.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
            UserCommitteeAccess(
                user_id=other_user.id,
                committee_id=committee_b.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
        ]
    )
    db.commit()

    member_a = add_member(
        db,
        committee_id=committee_a.id,
        name="Private Due Member",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    from app.services.member_due import add_member_due

    due = add_member_due(
        db,
        member_id=member_a.id,
        amount=500,
        due_date=date(2026, 8, 1),
        description="Private due",
        reference="PRIVATE-DUE",
    )
    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "due_other",
            "other-password",
        )

        assert response.status_code == 200

        token = response.json()["access_token"]

        response = client.post(
            f"/members/dues/{due.id}/pay",
            headers={
                "Authorization": f"Bearer {token}",
            },
            json={
                "amount": 500,
            },
        )

        assert response.status_code == 404

        db.refresh(due)
        assert due.paid_amount == 0

    finally:
        app.dependency_overrides.clear()


def test_user_cannot_create_settlement_for_member_from_another_committee(db):
    owner = make_user(
        db,
        "settlement_owner",
        "owner-password",
        UserRole.ADMIN.value,
    )

    other_user = make_user(
        db,
        "settlement_other",
        "other-password",
        UserRole.ADMIN.value,
    )

    committee_a = create_committee(
        db,
        name="Settlement Owner Committee",
    )
    committee_b = create_committee(
        db,
        name="Settlement Other Committee",
    )
    db.commit()

    from app.models import UserCommitteeAccess

    db.add_all(
        [
            UserCommitteeAccess(
                user_id=owner.id,
                committee_id=committee_a.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
            UserCommitteeAccess(
                user_id=other_user.id,
                committee_id=committee_b.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
        ]
    )
    db.commit()

    member_a = add_member(
        db,
        committee_id=committee_a.id,
        name="Private Settlement Member",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    rate = ContributionRate(
        committee_id=committee_a.id,
        amount=30000,
        effective_from=date(2026, 1, 1),
    )
    db.add(rate)
    db.commit()

    from app.services.contribution import record_contribution

    record_contribution(
        db,
        member_id=member_a.id,
        contribution_date=date(2026, 8, 1),
        reference="SETTLEMENT-PERMISSION",
    )
    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "settlement_other",
            "other-password",
        )

        assert response.status_code == 200

        token = response.json()["access_token"]

        response = client.post(
            f"/members/{member_a.id}/settlement",
            headers={
                "Authorization": f"Bearer {token}",
            },
            json={
                "settlement_date": "2026-08-10",
            },
        )

        assert response.status_code == 404

    finally:
        app.dependency_overrides.clear()


def test_user_cannot_pay_settlement_from_another_committee(db):
    owner = make_user(
        db,
        "settlement_pay_owner",
        "owner-password",
        UserRole.ADMIN.value,
    )

    other_user = make_user(
        db,
        "settlement_pay_other",
        "other-password",
        UserRole.ADMIN.value,
    )

    committee_a = create_committee(
        db,
        name="Settlement Pay Owner Committee",
    )
    committee_b = create_committee(
        db,
        name="Settlement Pay Other Committee",
    )
    db.commit()

    from app.models import UserCommitteeAccess

    db.add_all(
        [
            UserCommitteeAccess(
                user_id=owner.id,
                committee_id=committee_a.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
            UserCommitteeAccess(
                user_id=other_user.id,
                committee_id=committee_b.id,
                granted_by_user_id=owner.id,
                is_active=True,
            ),
        ]
    )
    db.commit()

    member_a = add_member(
        db,
        committee_id=committee_a.id,
        name="Private Settlement Pay Member",
        joined_on=date(2026, 1, 1),
    )
    db.commit()

    rate = ContributionRate(
        committee_id=committee_a.id,
        amount=30000,
        effective_from=date(2026, 1, 1),
    )
    db.add(rate)
    db.commit()

    from app.services.contribution import record_contribution
    from app.services.member_settlement import settle_member

    record_contribution(
        db,
        member_id=member_a.id,
        contribution_date=date(2026, 8, 1),
        reference="SETTLEMENT-PAY-PERMISSION",
    )
    db.commit()

    settlement = settle_member(
        db,
        member_id=member_a.id,
        settlement_date=date(2026, 8, 10),
    )
    db.commit()

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "settlement_pay_other",
            "other-password",
        )

        assert response.status_code == 200

        token = response.json()["access_token"]

        response = client.post(
            f"/members/settlement/{settlement.id}/pay",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert response.status_code == 404

        db.refresh(settlement)
        assert settlement.status == "pending"

    finally:
        app.dependency_overrides.clear()


def test_super_admin_can_grant_committee_access(db):
    super_admin = make_user(
        db,
        "grant_super_admin",
        "super-password",
        UserRole.SUPER_ADMIN.value,
    )
    target_user = make_user(
        db,
        "grant_target",
        "target-password",
        UserRole.VIEWER.value,
    )

    committee = Committee(
        name="Grant Access Committee",
        is_active=True,
    )
    db.add(committee)
    db.commit()
    db.refresh(committee)

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "grant_super_admin",
            "super-password",
        )

        assert response.status_code == 200
        token = response.json()["access_token"]

        response = client.post(
            f"/users/{target_user.id}/committees/{committee.id}/access",
            headers={
                "Authorization": f"Bearer {token}",
            },
            json={
                "user_id": target_user.id,
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert data["user_id"] == target_user.id
        assert data["committee_id"] == committee.id
        assert data["is_active"] is True

    finally:
        app.dependency_overrides.clear()


def test_admin_cannot_grant_committee_access(db):
    admin = make_user(
        db,
        "grant_admin",
        "admin-password",
        UserRole.ADMIN.value,
    )
    target_user = make_user(
        db,
        "grant_admin_target",
        "target-password",
        UserRole.VIEWER.value,
    )

    committee = Committee(
        name="Admin Grant Committee",
        is_active=True,
    )
    db.add(committee)
    db.commit()
    db.refresh(committee)

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "grant_admin",
            "admin-password",
        )

        assert response.status_code == 200
        token = response.json()["access_token"]

        response = client.post(
            f"/users/{target_user.id}/committees/{committee.id}/access",
            headers={
                "Authorization": f"Bearer {token}",
            },
            json={
                "user_id": target_user.id,
            },
        )

        assert response.status_code == 403

    finally:
        app.dependency_overrides.clear()


def test_super_admin_can_read_committee_access(db):
    super_admin = make_user(
        db,
        "read_access_super_admin",
        "super-password",
        UserRole.SUPER_ADMIN.value,
    )
    target_user = make_user(
        db,
        "read_access_target",
        "target-password",
        UserRole.VIEWER.value,
    )

    committee = Committee(
        name="Read Access Committee",
        is_active=True,
    )
    db.add(committee)
    db.commit()
    db.refresh(committee)

    from app.models import UserCommitteeAccess

    access = UserCommitteeAccess(
        user_id=target_user.id,
        committee_id=committee.id,
        granted_by_user_id=super_admin.id,
        is_active=True,
    )
    db.add(access)
    db.commit()
    db.refresh(access)

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "read_access_super_admin",
            "super-password",
        )

        assert response.status_code == 200
        token = response.json()["access_token"]

        response = client.get(
            f"/users/{target_user.id}/committees/{committee.id}/access",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == access.id
        assert data["user_id"] == target_user.id
        assert data["committee_id"] == committee.id
        assert data["is_active"] is True

    finally:
        app.dependency_overrides.clear()


def test_super_admin_can_deactivate_committee_access(db):
    super_admin = make_user(
        db,
        "deactivate_super_admin",
        "super-password",
        UserRole.SUPER_ADMIN.value,
    )
    target_user = make_user(
        db,
        "deactivate_target",
        "target-password",
        UserRole.VIEWER.value,
    )

    committee = Committee(
        name="Deactivate Access Committee",
        is_active=True,
    )
    db.add(committee)
    db.commit()
    db.refresh(committee)

    from app.models import UserCommitteeAccess

    access = UserCommitteeAccess(
        user_id=target_user.id,
        committee_id=committee.id,
        granted_by_user_id=super_admin.id,
        is_active=True,
    )
    db.add(access)
    db.commit()
    db.refresh(access)

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "deactivate_super_admin",
            "super-password",
        )

        assert response.status_code == 200
        token = response.json()["access_token"]

        response = client.patch(
            f"/users/{target_user.id}/committees/{committee.id}/access/deactivate",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == access.id
        assert data["user_id"] == target_user.id
        assert data["committee_id"] == committee.id
        assert data["is_active"] is False

        db.refresh(access)
        assert access.is_active is False

    finally:
        app.dependency_overrides.clear()


def test_admin_cannot_deactivate_committee_access(db):
    admin = make_user(
        db,
        "deactivate_admin",
        "admin-password",
        UserRole.ADMIN.value,
    )
    target_user = make_user(
        db,
        "deactivate_admin_target",
        "target-password",
        UserRole.VIEWER.value,
    )

    committee = Committee(
        name="Admin Deactivate Committee",
        is_active=True,
    )
    db.add(committee)
    db.commit()
    db.refresh(committee)

    from app.models import UserCommitteeAccess

    access = UserCommitteeAccess(
        user_id=target_user.id,
        committee_id=committee.id,
        granted_by_user_id=admin.id,
        is_active=True,
    )
    db.add(access)
    db.commit()
    db.refresh(access)

    app.dependency_overrides[get_db] = override_db(db)

    try:
        client = TestClient(app)

        response = login(
            client,
            "deactivate_admin",
            "admin-password",
        )

        assert response.status_code == 200
        token = response.json()["access_token"]

        response = client.patch(
            f"/users/{target_user.id}/committees/{committee.id}/access/deactivate",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert response.status_code == 403

        db.refresh(access)
        assert access.is_active is True

    finally:
        app.dependency_overrides.clear()
