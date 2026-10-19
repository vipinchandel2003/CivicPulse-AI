import uuid
from typing import Optional, Tuple
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from civicpulse_app.models.spatial_user import User, Ward, UserWardAssignment
from civicpulse_app.models.issue import CivicIssue, IssueStatus, IssueEvent
from civicpulse_app.domain.enums import UserRole, Department


class RoutingService:
    @staticmethod
    async def assign_ticket_to_inspector(
        session: AsyncSession, issue: CivicIssue
    ) -> Tuple[Optional[uuid.UUID], IssueStatus]:
        """
        Skill S2 / Agent-Runtime §6:
        1. Checks issue.ward_id.
        2. Queries on-duty FIELD_INSPECTORs assigned to this ward (or matching department).
        3. Selects the inspector with the least number of open tickets (load balancing).
        4. If none found: sets status to UNROUTED.
        5. If found: sets assigned_to, updates status to ASSIGNED, writes audit event.
        """
        if not issue.ward_id:
            issue.status = IssueStatus.UNROUTED
            return None, IssueStatus.UNROUTED

        # Find eligible on-duty inspectors for this ward
        open_statuses = [
            IssueStatus.ASSIGNED,
            IssueStatus.IN_PROGRESS,
            IssueStatus.REOPENED,
        ]

        # Query inspectors linked to ward via user_ward_assignments who are on_duty and active
        inspector_query = (
            select(User.id)
            .join(UserWardAssignment, UserWardAssignment.user_id == User.id)
            .where(
                and_(
                    UserWardAssignment.ward_id == issue.ward_id,
                    User.role == UserRole.FIELD_INSPECTOR,
                    User.is_active.is_(True),
                    User.on_duty.is_(True),
                )
            )
        )
        inspector_ids = (await session.execute(inspector_query)).scalars().all()

        if not inspector_ids:
            issue.status = IssueStatus.UNROUTED
            return None, IssueStatus.UNROUTED

        # Pick least-loaded inspector among eligible
        load_query = (
            select(CivicIssue.assigned_to, func.count(CivicIssue.id).label("load"))
            .where(
                and_(
                    CivicIssue.assigned_to.in_(inspector_ids),
                    CivicIssue.status.in_(open_statuses),
                )
            )
            .group_by(CivicIssue.assigned_to)
        )
        load_rows = (await session.execute(load_query)).all()
        load_dict = {row[0]: row[1] for row in load_rows}

        # Find inspector with minimum count (0 if not in load_dict)
        least_loaded_id = min(inspector_ids, key=lambda uid: load_dict.get(uid, 0))

        old_status = issue.status
        issue.assigned_to = least_loaded_id
        issue.status = IssueStatus.ASSIGNED

        event = IssueEvent(
            issue_id=issue.id,
            actor_id=None,
            event_type="ISSUE_ROUTED_AND_ASSIGNED",
            from_status=old_status,
            to_status=IssueStatus.ASSIGNED,
            payload={
                "assigned_to": str(least_loaded_id),
                "ward_id": str(issue.ward_id),
            },
        )
        session.add(event)

        return least_loaded_id, IssueStatus.ASSIGNED
