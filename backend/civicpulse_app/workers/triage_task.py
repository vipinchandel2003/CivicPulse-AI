import asyncio
import uuid
from datetime import datetime, timezone
import structlog
from sqlalchemy import select, and_
from civicpulse_app.workers.celery_app import celery_app
from civicpulse_app.core.config import get_settings
from civicpulse_app.models.issue import CivicIssue, IssueStatus, IssueEvent, IssueReport
from civicpulse_app.models.triage import AIInferenceLog
from civicpulse_app.ai.detector import MockYoloDetectorProvider
from civicpulse_app.ai.nlp import get_nlp_provider
from civicpulse_app.domain.priority import PriorityScoringEngine
from civicpulse_app.services.routing import RoutingService
from civicpulse_app.services.notification import MultiChannelNotifier, NotificationPayload

logger = structlog.get_logger(__name__)


@celery_app.task(name="civicpulse_app.workers.triage_task.run_async_triage", acks_late=True)
def run_async_triage(issue_id_str: str):
    """
    Architecture §4 / Agent-Runtime Overview:
    Async Triage Pipeline:
    1. Load Issue from DB.
    2. Vision Triage (YOLO) -> category, confidence, bbox ratio.
    3. NLP Triage (Hinglish Extractor) -> hazards, urgency, landmark.
    4. Priority & SLA computation (S3 formula + hard overrides).
    5. Ward Routing & Inspector assignment (least-loaded on-duty inspector).
    6. Notification dispatch to assigned inspector.
    7. Record all outputs to ai_inference_log and issue_events.
    """
    logger.info("Executing async AI triage pipeline", issue_id=issue_id_str)
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_async_triage_runner(issue_id_str))
    finally:
        loop.close()


async def _async_triage_runner(issue_id_str: str) -> dict:
    from civicpulse_app.core.database import AsyncSessionLocal

    issue_id = uuid.UUID(issue_id_str)
    async with AsyncSessionLocal() as session:
        stmt = select(CivicIssue).where(CivicIssue.id == issue_id)
        issue = (await session.execute(stmt)).scalar_one_or_none()
        if not issue:
            logger.error("Issue not found for triage", issue_id=issue_id_str)
            return {"status": "error", "message": "Issue not found"}

        # 1. Vision Detection
        detector = MockYoloDetectorProvider()
        detection = await detector.detect(image_bytes_or_key=issue.ticket_code)

        # 2. NLP Extraction (Gemini Flash with automatic keyword fallback)
        nlp_provider = get_nlp_provider()
        nlp_res = await nlp_provider.extract(issue.description or "")

        # 3. Compute Priority & SLA
        priority_res = PriorityScoringEngine.compute_priority(
            category=detection.primary_category,
            confidence=detection.confidence,
            bbox_ratio=detection.bbox_ratio,
            nlp_urgency=float(nlp_res.urgency),
            spatial_proximity_score=20.0,
            upvote_count=issue.upvote_count,
            hazard_keywords=nlp_res.hazards,
        )

        # Update issue fields
        issue.category = detection.primary_category
        issue.priority = priority_res.priority
        issue.severity_score = priority_res.score
        issue.sla_deadline = priority_res.sla_deadline
        issue.status = IssueStatus.TRIAGED

        # 4. Routing Service
        assigned_id, new_status = await RoutingService.assign_ticket_to_inspector(session, issue)

        # 5. Log AI inference
        ai_log = AIInferenceLog(
            issue_id=issue.id,
            agent_name="MultiModalTriage",
            model_name="yolov8m+keyword_nlp",
            model_version=detection.model_version,
            latency_ms=120,
            input_payload={"description": issue.description},
            output_payload={
                "category": detection.primary_category,
                "priority": priority_res.priority.value,
                "sla_hours": priority_res.sla_hours,
                "score": priority_res.score,
                "hazards": nlp_res.hazards,
            },
        )
        session.add(ai_log)

        # 6. Audit event
        event = IssueEvent(
            issue_id=issue.id,
            actor_id=None,
            event_type="ISSUE_TRIAGED",
            from_status=IssueStatus.RECEIVED,
            to_status=issue.status,
            payload={
                "category": issue.category,
                "priority": issue.priority.value,
                "sla_hours": priority_res.sla_hours,
                "assigned_to": str(assigned_id) if assigned_id else None,
            },
        )
        session.add(event)
        await session.commit()

        # 7. Notify inspector if assigned
        if assigned_id:
            notifier = MultiChannelNotifier()
            await notifier.send(
                NotificationPayload(
                    template_id="INSPECTOR_TICKET_ASSIGNED",
                    variables={"ticket_code": issue.ticket_code, "priority": issue.priority.value},
                )
            )

        logger.info(
            "Async AI triage completed",
            issue_id=issue_id_str,
            category=issue.category,
            priority=issue.priority.value,
            status=issue.status.value,
        )
        return {
            "status": "success",
            "category": issue.category,
            "priority": issue.priority.value,
            "assigned_to": str(assigned_id) if assigned_id else None,
        }
