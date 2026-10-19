from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from civicpulse_app.core.database import get_db
from civicpulse_app.core.rbac import get_current_user, require_roles
from civicpulse_app.models.spatial_user import User
from civicpulse_app.models.issue import CivicIssue, IssueStatus
from civicpulse_app.domain.enums import UserRole
from civicpulse_app.schemas.routing import DutyToggleRequest, InspectorTaskItem

router = APIRouter(prefix="/inspector", tags=["Inspector App"])


@router.post("/duty")
async def toggle_on_duty(
    payload: DutyToggleRequest,
    current_user: User = Depends(require_roles([UserRole.FIELD_INSPECTOR])),
    db: AsyncSession = Depends(get_db),
):
    """
    Inspector toggles duty status (On Duty / Off Duty).
    Routing engine ignores off-duty inspectors.
    """
    current_user.on_duty = payload.on_duty
    await db.commit()
    return {"message": "Duty status updated", "on_duty": current_user.on_duty}


@router.get("/tasks", response_model=List[InspectorTaskItem])
async def get_inspector_tasks(
    current_user: User = Depends(require_roles([UserRole.FIELD_INSPECTOR])),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns active assigned tickets for the authenticated inspector.
    Scoped strictly to the inspector's assignments.
    """
    active_statuses = [
        IssueStatus.ASSIGNED,
        IssueStatus.IN_PROGRESS,
        IssueStatus.PENDING_AUDIT,
        IssueStatus.REOPENED,
    ]

    stmt = (
        select(CivicIssue)
        .where(
            and_(
                CivicIssue.assigned_to == current_user.id,
                CivicIssue.status.in_(active_statuses),
            )
        )
        .order_by(CivicIssue.priority.asc(), CivicIssue.created_at.desc())
    )

    rows = (await db.execute(stmt)).scalars().all()
    tasks = []
    for issue in rows:
        tasks.append(
            InspectorTaskItem(
                id=issue.id,
                ticket_code=issue.ticket_code,
                title=issue.title,
                category=issue.category,
                priority=issue.priority.value,
                status=issue.status.value,
                sla_deadline=issue.sla_deadline.isoformat() if issue.sla_deadline else None,
                created_at=issue.created_at.isoformat(),
            )
        )
    return tasks
