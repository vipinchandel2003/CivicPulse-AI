from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class EscalationDecision(BaseModel):
    issue_id: str
    elapsed_ratio: float
    new_escalation_level: int
    action: str  # NONE, WARN_75, BREACH_L1, BREACH_L2, DRAFT_L3
    kpi_delta: float
    notify_role: Optional[str] = None
    reason: str


class SLAEscalationEngine:
    """
    Skill S10 / Architecture §7:
    Elapsed ratio = (current_time - created_at) / (sla_deadline - created_at)

    Ladder rules:
    - ratio >= 0.75 and current_level == 0 (and warning not sent): WARN_75 to Tier 1
    - ratio >= 1.00 and current_level < 1: SLA_BREACHED_L1 (CSI/AE alert, KPI -5)
    - ratio >= 1.50 and current_level < 2: SLA_BREACHED_L2 (Zonal Officer + ICCC Red List)
    - ratio >= 2.00 and current_level < 3: SLA_BREACHED_L3 (Draft show-cause to Dept Head)
    """

    @classmethod
    def evaluate_ticket(
        cls,
        issue_id: str,
        created_at: datetime,
        sla_deadline: datetime,
        current_escalation_level: int,
        evaluation_time: Optional[datetime] = None,
    ) -> EscalationDecision:
        if evaluation_time is None:
            evaluation_time = datetime.now(timezone.utc)

        total_window = (sla_deadline - created_at).total_seconds()
        if total_window <= 0:
            total_window = 1.0  # Guard against division by zero

        elapsed = (evaluation_time - created_at).total_seconds()
        ratio = elapsed / total_window

        # Check L3
        if ratio >= 2.0 and current_escalation_level < 3:
            return EscalationDecision(
                issue_id=issue_id,
                elapsed_ratio=round(ratio, 2),
                new_escalation_level=3,
                action="DRAFT_L3",
                kpi_delta=-10.0,
                notify_role="DEPT_HOD",
                reason=f"SLA breached by {ratio:.1f}x (>200% elapsed). Draft show-cause notice generated for HOD.",
            )

        # Check L2
        if ratio >= 1.5 and current_escalation_level < 2:
            return EscalationDecision(
                issue_id=issue_id,
                elapsed_ratio=round(ratio, 2),
                new_escalation_level=2,
                action="BREACH_L2",
                kpi_delta=-5.0,
                notify_role="ZONAL_OFFICER",
                reason=f"SLA breached by {ratio:.1f}x (150% elapsed). Escalated to Zonal Officer & ICCC Red List.",
            )

        # Check L1
        if ratio >= 1.0 and current_escalation_level < 1:
            return EscalationDecision(
                issue_id=issue_id,
                elapsed_ratio=round(ratio, 2),
                new_escalation_level=1,
                action="BREACH_L1",
                kpi_delta=-5.0,
                notify_role="WARD_CSI",
                reason=f"SLA deadline breached (100% elapsed). Escalated to Ward CSI/AE; -5 KPI penalty applied.",
            )

        # Check 75% early warning
        if ratio >= 0.75 and current_escalation_level == 0:
            return EscalationDecision(
                issue_id=issue_id,
                elapsed_ratio=round(ratio, 2),
                new_escalation_level=0,  # Warning does not advance level until full breach
                action="WARN_75",
                kpi_delta=0.0,
                notify_role="FIELD_INSPECTOR",
                reason=f"SLA 75% elapsed warning. {ratio*100:.0f}% time elapsed without resolution.",
            )

        return EscalationDecision(
            issue_id=issue_id,
            elapsed_ratio=round(ratio, 2),
            new_escalation_level=current_escalation_level,
            action="NONE",
            kpi_delta=0.0,
            notify_role=None,
            reason="Within allowable SLA window.",
        )
