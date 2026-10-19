import asyncio
from datetime import datetime, timezone
import structlog
from sqlalchemy import select, and_
from civicpulse_app.workers.celery_app import celery_app
from civicpulse_app.models.issue import CivicIssue, IssueStatus, IssueEvent
from civicpulse_app.models.escalation import Escalation, KPIEvent, ShowCauseRecommendation
from civicpulse_app.domain.escalation import SLAEscalationEngine

logger = structlog.get_logger(__name__)


@celery_app.task(name="civicpulse_app.workers.escalation_task.scan_and_escalate_sla_breaches")
def scan_and_escalate_sla_breaches():
    """
    Skill S10 / Architecture §7 / Finding 1:
    Runs every 5 minutes.
    Selects open tickets using FOR UPDATE SKIP LOCKED so parallel beat runs never double-escalate.
    Evaluates elapsed ratio and writes to escalations, kpi_events, and issue_events.
    """
    logger.info("Starting SLA escalation scan...")
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_scan_and_escalate_runner())
    finally:
        loop.close()


async def _scan_and_escalate_runner() -> dict:
    from civicpulse_app.core.database import AsyncSessionLocal

    active_statuses = [
        IssueStatus.ASSIGNED,
        IssueStatus.IN_PROGRESS,
        IssueStatus.TRIAGED,
        IssueStatus.UNROUTED,
        IssueStatus.REOPENED,
    ]

    now = datetime.now(timezone.utc)
    processed_count = 0
    escalated_count = 0

    async with AsyncSessionLocal() as session:
        # SELECT ... FOR UPDATE SKIP LOCKED to prevent race conditions across workers
        stmt = (
            select(CivicIssue)
            .where(
                and_(
                    CivicIssue.status.in_(active_statuses),
                    CivicIssue.sla_deadline.is_not(None),
                    CivicIssue.escalation_level < 3,
                )
            )
            .with_for_update(skip_locked=True)
        )

        result = await session.execute(stmt)
        issues = result.scalars().all()

        for issue in issues:
            processed_count += 1
            decision = SLAEscalationEngine.evaluate_ticket(
                issue_id=str(issue.id),
                created_at=issue.created_at,
                sla_deadline=issue.sla_deadline,
                current_escalation_level=issue.escalation_level,
                evaluation_time=now,
            )

            if decision.action != "NONE":
                old_level = issue.escalation_level
                issue.escalation_level = decision.new_escalation_level

                # 1. Record in escalations table
                escalation_record = Escalation(
                    issue_id=issue.id,
                    level=decision.new_escalation_level,
                    notified_parties={
                        "notified_role": decision.notify_role,
                        "action": decision.action,
                        "elapsed_ratio": decision.elapsed_ratio,
                    },
                )
                session.add(escalation_record)

                # 2. Record KPI penalty if applicable (e.g. -5.0 for L1 breach)
                if decision.kpi_delta != 0.0 and issue.assigned_to:
                    kpi_entry = KPIEvent(
                        user_id=issue.assigned_to,
                        issue_id=issue.id,
                        delta_score=decision.kpi_delta,
                        reason=decision.reason,
                    )
                    session.add(kpi_entry)

                # 3. If L3 breach, generate draft recommendation for HOD
                if decision.action == "DRAFT_L3" and issue.assigned_to:
                    draft = ShowCauseRecommendation(
                        user_id=issue.assigned_to,
                        issue_id=issue.id,
                        draft_letter=(
                            f"SHOW CAUSE NOTICE DRAFT:\n"
                            f"Ticket: {issue.ticket_code}\n"
                            f"Category: {issue.category}\n"
                            f"Elapsed ratio: {decision.elapsed_ratio:.1f}x of SLA\n"
                            f"Recommendation: Explain why disciplinary action should not be taken for chronic breach."
                        ),
                    )
                    session.add(draft)

                # 4. Append-only issue_events log
                event = IssueEvent(
                    issue_id=issue.id,
                    actor_id=None,
                    event_type=f"SLA_ESCALATED_{decision.action}",
                    from_status=issue.status,
                    to_status=issue.status,
                    payload={
                        "old_level": old_level,
                        "new_level": decision.new_escalation_level,
                        "ratio": decision.elapsed_ratio,
                        "reason": decision.reason,
                    },
                )
                session.add(event)
                escalated_count += 1

        if escalated_count > 0:
            await session.commit()

    logger.info(
        "SLA escalation scan completed",
        scanned=processed_count,
        escalated=escalated_count,
    )
    return {
        "status": "completed",
        "scanned": processed_count,
        "escalated": escalated_count,
    }
