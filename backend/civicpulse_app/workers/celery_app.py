from celery import Celery
from celery.schedules import crontab
from civicpulse_app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "civicpulse_workers",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

# Celery Beat 5-minute schedule for SLA escalation scan
celery_app.conf.beat_schedule = {
    "scan-sla-escalations-every-5-min": {
        "task": "civicpulse_app.workers.escalation_task.scan_and_escalate_sla_breaches",
        "schedule": 300.0,  # 5 minutes
    },
}
