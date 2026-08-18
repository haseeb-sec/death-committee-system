from app.models import AuditLog
from app.services.audit import record_audit


def test_record_audit_creates_log(db):
    log = record_audit(
        db,
        user_id=1,
        action="test",
        entity_type="system",
        entity_id=None,
        description="Audit service test",
    )

    db.commit()
    db.refresh(log)

    assert log.id is not None
    assert log.user_id == 1
    assert log.action == "test"
    assert log.entity_type == "system"
    assert log.entity_id is None
    assert log.description == "Audit service test"
    assert log.created_at is not None


def test_record_audit_can_store_entity_reference(db):
    log = record_audit(
        db,
        user_id=7,
        action="create",
        entity_type="member",
        entity_id=25,
        description="Created member 'Test Member'",
    )

    db.commit()

    stored = db.get(AuditLog, log.id)

    assert stored is not None
    assert stored.user_id == 7
    assert stored.action == "create"
    assert stored.entity_type == "member"
    assert stored.entity_id == 25
    assert stored.description == "Created member 'Test Member'"


def test_audit_rolls_back_with_transaction(db):
    record_audit(
        db,
        user_id=1,
        action="test_rollback",
        entity_type="system",
        description="This must not survive rollback",
    )

    db.rollback()

    logs = (
        db.query(AuditLog)
        .filter(AuditLog.action == "test_rollback")
        .all()
    )

    assert logs == []
