import pytest
import uuid
from civicpulse_app.workers.escalation_task import scan_and_escalate_sla_breaches
from civicpulse_app.workers.triage_task import run_async_triage
from civicpulse_app.services.storage import StorageService


def test_storage_service_url_generation():
    service = StorageService()
    url = service.get_presigned_download_url("reports/sample.jpg", expires_minutes=10)
    assert "reports/sample.jpg" in url
    assert "token" in url or "http" in url


def test_celery_task_signatures_registered():
    assert scan_and_escalate_sla_breaches.name == "civicpulse_app.workers.escalation_task.scan_and_escalate_sla_breaches"
    assert run_async_triage.name == "civicpulse_app.workers.triage_task.run_async_triage"
