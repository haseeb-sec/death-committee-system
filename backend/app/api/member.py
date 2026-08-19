from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.api.permissions import require_admin, require_authenticated
from app.schemas.member import (
    MemberCreate,
    MemberFinancialSummaryResponse,
    MemberLeave,
    MemberResponse,
    MemberStatementResponse,
)
from app.api.permissions import require_admin, require_authenticated
from app.services.accounting import AccountingError
from app.services.member import add_member, leave_member
from app.services.member_financial import (
    get_member_financial_summary,
)
from app.services.member_statement import (
    get_member_statement,
)
from app.services.audit import record_audit
from app.services.access_control import require_committee_access, require_member_access


router = APIRouter(
    prefix="/members",
    tags=["Members"],
)


@router.post("", response_model=MemberResponse)
def create_member_api(
    data: MemberCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    try:
        require_committee_access(
            db,
            user=current_user,
            committee_id=data.committee_id,
        )

        member = add_member(
            db,
            committee_id=data.committee_id,
            name=data.name,
            joined_on=data.joined_on,
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="create",
            entity_type="member",
            entity_id=member.id,
            description=f"Created member '{member.name}' in committee {member.committee_id}",
        )

        db.commit()
        db.refresh(member)

        return {
            "id": member.id,
            "committee_id": member.committee_id,
            "name": member.name,
            "joined_on": member.joined_on,
            "is_active": member.is_active,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.post(
    "/{member_id}/leave",
    response_model=MemberResponse,
)
def leave_member_api(
    member_id: int,
    data: MemberLeave,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    try:
        require_member_access(
            db,
            user=current_user,
            member_id=member_id,
        )

        member = leave_member(
            db,
            member_id=member_id,
            leaving_date=data.leaving_date,
        )

        record_audit(
            db,
            user_id=current_user.id,
            action="leave",
            entity_type="member",
            entity_id=member.id,
            description=f"Member '{member.name}' left committee {member.committee_id}",
        )

        db.commit()
        db.refresh(member)

        return {
            "id": member.id,
            "committee_id": member.committee_id,
            "name": member.name,
            "joined_on": member.joined_on,
            "left_on": member.left_on,
            "is_active": member.is_active,
        }

    except AccountingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.get(
    "/{member_id}/financial-summary",
    response_model=MemberFinancialSummaryResponse,
)
def member_financial_summary(
    member_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        require_member_access(
            db,
            user=current_user,
            member_id=member_id,
        )

        return get_member_financial_summary(
            db,
            member_id=member_id,
        )
    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@router.get(
    "/{member_id}/statement",
    response_model=list[MemberStatementResponse],
)
def member_statement(
    member_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        require_member_access(
            db,
            user=current_user,
            member_id=member_id,
        )

        return get_member_statement(
            db,
            member_id=member_id,
        )
    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
