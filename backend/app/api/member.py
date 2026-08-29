from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.api.permissions import require_authenticated
from app.schemas.member import (
    MemberAssetBreakdownEntry,
    MemberCreate,
    MemberFinancialSummaryResponse,
    MemberLeave,
    MemberResponse,
    MemberStatementResponse,
)
from app.services.accounting import AccountingError
from app.models import Member, User, UserRole
from app.services.member import add_member, leave_member, list_members
from app.services.member_financial import (
    get_member_financial_summary,
)
from app.services.member_statement import (
    get_member_statement,
)
from app.services.asset_share import get_member_asset_breakdown
from app.services.audit import record_audit
from app.services.access_control import (
    grant_committee_access,
    require_committee_admin_access,
    require_committee_access,
    require_member_access,
)


router = APIRouter(
    prefix="/members",
    tags=["Members"],
)


@router.post("", response_model=MemberResponse)
def create_member_api(
    data: MemberCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        require_committee_admin_access(
            db,
            user=current_user,
            committee_id=data.committee_id,
        )

        member = add_member(
            db,
            committee_id=data.committee_id,
            username=data.username,
            password=data.password,
            name=data.name,
            joined_on=data.joined_on,
        )

        grant_committee_access(
            db,
            user=db.get(User, member.user_id),
            committee_id=data.committee_id,
            granted_by_user=current_user,
        )

        record_audit(
            db,
            user_id=current_user.id,
            committee_id=member.committee_id,
            action="create",
            entity_type="member",
            entity_id=member.id,
            description=f"Created member '{member.name}' in committee {member.committee_id}",
        )

        db.commit()
        db.refresh(member)

        return {
            "id": member.id,
            "user_id": member.user_id,
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


@router.get("", response_model=list[MemberResponse])
def list_members_api(
    committee_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    require_committee_access(
        db,
        user=current_user,
        committee_id=committee_id,
    )

    # Super Admins and assigned Committee Admins may view the
    # complete member list for the selected committee.
    if current_user.role in (
        UserRole.SUPER_ADMIN.value,
        UserRole.COMMITTEE_ADMIN.value,
    ):
        if current_user.role == UserRole.COMMITTEE_ADMIN.value:
            require_committee_admin_access(
                db,
                user=current_user,
                committee_id=committee_id,
            )

        return list_members(
            db,
            committee_id=committee_id,
        )

    # Committee Members may only see their own member record.
    member = (
        db.query(Member)
        .filter(
            Member.user_id == current_user.id,
            Member.committee_id == committee_id,
        )
        .first()
    )

    if member is None:
        raise HTTPException(
            status_code=404,
            detail="Member record not found",
        )

    return [member]


@router.post(
    "/{member_id}/leave",
    response_model=MemberResponse,
)
def leave_member_api(
    member_id: int,
    data: MemberLeave,
    db: Session = Depends(get_db),
    current_user = Depends(require_authenticated),
):
    try:
        member = db.get(Member, member_id)

        if member is None:
            raise HTTPException(
                status_code=404,
                detail="Member not found",
            )

        require_committee_admin_access(
            db,
            user=current_user,
            committee_id=member.committee_id,
        )

        member = leave_member(
            db,
            member_id=member_id,
            leaving_date=data.leaving_date,
        )

        record_audit(
            db,
            user_id=current_user.id,
            committee_id=member.committee_id,
            action="leave",
            entity_type="member",
            entity_id=member.id,
            description=f"Member '{member.name}' left committee {member.committee_id}",
        )

        db.commit()
        db.refresh(member)

        return {
            "id": member.id,
            "user_id": member.user_id,
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


@router.get(
    "/{member_id}/asset-breakdown",
    response_model=list[MemberAssetBreakdownEntry],
)
def member_asset_breakdown(
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

        return get_member_asset_breakdown(
            db,
            member_id=member_id,
        )
    except AccountingError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
