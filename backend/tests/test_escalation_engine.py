from datetime import datetime, timedelta, timezone
import pytest
from civicpulse_app.domain.escalation import SLAEscalationEngine


def test_escalation_under_threshold():
    created = datetime(2026, 10, 18, 10, 0, tzinfo=timezone.utc)
    deadline = datetime(2026, 10, 18, 16, 0, tzinfo=timezone.utc)  # 6h window
    current = datetime(2026, 10, 18, 12, 0, tzinfo=timezone.utc)   # 2h elapsed (ratio ~0.33)

    decision = SLAEscalationEngine.evaluate_ticket(
        issue_id="test-1",
        created_at=created,
        sla_deadline=deadline,
        current_escalation_level=0,
        evaluation_time=current,
    )
    assert decision.action == "NONE"
    assert decision.new_escalation_level == 0


def test_escalation_75_percent_warning():
    created = datetime(2026, 10, 18, 10, 0, tzinfo=timezone.utc)
    deadline = datetime(2026, 10, 18, 16, 0, tzinfo=timezone.utc)  # 6h window
    current = datetime(2026, 10, 18, 14, 30, tzinfo=timezone.utc)  # 4.5h elapsed (ratio = 0.75)

    decision = SLAEscalationEngine.evaluate_ticket(
        issue_id="test-1",
        created_at=created,
        sla_deadline=deadline,
        current_escalation_level=0,
        evaluation_time=current,
    )
    assert decision.action == "WARN_75"
    assert decision.notify_role == "FIELD_INSPECTOR"


def test_escalation_100_percent_l1_breach():
    created = datetime(2026, 10, 18, 10, 0, tzinfo=timezone.utc)
    deadline = datetime(2026, 10, 18, 16, 0, tzinfo=timezone.utc)  # 6h window
    current = datetime(2026, 10, 18, 16, 5, tzinfo=timezone.utc)   # Past deadline (ratio > 1.0)

    decision = SLAEscalationEngine.evaluate_ticket(
        issue_id="test-1",
        created_at=created,
        sla_deadline=deadline,
        current_escalation_level=0,
        evaluation_time=current,
    )
    assert decision.action == "BREACH_L1"
    assert decision.new_escalation_level == 1
    assert decision.notify_role == "WARD_CSI"
    assert decision.kpi_delta == -5.0


def test_escalation_150_percent_l2_breach():
    created = datetime(2026, 10, 18, 10, 0, tzinfo=timezone.utc)
    deadline = datetime(2026, 10, 18, 16, 0, tzinfo=timezone.utc)  # 6h window
    current = datetime(2026, 10, 18, 19, 0, tzinfo=timezone.utc)   # 9h elapsed (ratio = 1.5)

    decision = SLAEscalationEngine.evaluate_ticket(
        issue_id="test-1",
        created_at=created,
        sla_deadline=deadline,
        current_escalation_level=1,
        evaluation_time=current,
    )
    assert decision.action == "BREACH_L2"
    assert decision.new_escalation_level == 2
    assert decision.notify_role == "ZONAL_OFFICER"


def test_escalation_200_percent_l3_draft_show_cause():
    created = datetime(2026, 10, 18, 10, 0, tzinfo=timezone.utc)
    deadline = datetime(2026, 10, 18, 16, 0, tzinfo=timezone.utc)  # 6h window
    current = datetime(2026, 10, 18, 22, 0, tzinfo=timezone.utc)   # 12h elapsed (ratio = 2.0)

    decision = SLAEscalationEngine.evaluate_ticket(
        issue_id="test-1",
        created_at=created,
        sla_deadline=deadline,
        current_escalation_level=2,
        evaluation_time=current,
    )
    assert decision.action == "DRAFT_L3"
    assert decision.new_escalation_level == 3
    assert decision.notify_role == "DEPT_HOD"
    assert "Draft show-cause" in decision.reason
