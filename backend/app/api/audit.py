from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.auth import get_db
from app.api.permissions import require_admin
from app.models import User, UserRole
from app.schemas.audit import AuditLogResponse
from app.services.accounting import AccountingError
from app.services.access_control import require_committee_admin_access
from app.services.audit import get_audit_logs


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


@router.get(
    "",
    response_model=list[AuditLogResponse],
)
def list_audit_logs(
    entity_type: str | None = Query(None),
    entity_id: int | None = Query(None, ge=1),
    user_id: int | None = Query(None, ge=1),
    committee_id: int | None = Query(None, ge=1),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    List audit log entries.

    SUPER_ADMIN:
        Full platform-wide access. May list without a committee_id
        filter (including platform-level events, which have
        committee_id=None) or scope to any committee.

    COMMITTEE_ADMIN:
        Must supply committee_id, and must have administrative
        access to that exact committee. Cannot list platform-wide
        or view another committee's audit trail by omitting or
        changing the filter.
    """

    try:
        if current_user.role != UserRole.SUPER_ADMIN.value:
            if committee_id is None:
                raise HTTPException(
                    status_code=403,
                    detail=(
                        "committee_id is required for Committee Admin "
                        "audit log access"
                    ),
                )

            require_committee_admin_access(
                db,
                user=current_user,
                committee_id=committee_id,
            )

    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return get_audit_logs(
        db,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        committee_id=committee_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
