from pydantic import BaseModel
from typing import Dict, Any


class CompositeKPIResult(BaseModel):
    score: float  # Normalized 0 - 100
    sla_percentage: float
    csat_normalized: float
    speed_normalized: float
    reopen_penalty: float


class KPICalculator:
    """
    Skill S11 / PRD Correction D5:
    Normalizes all metrics to 0-100:
    - SLA%: 0 - 100
    - CSAT_norm = (avg_csat - 1) / 4.0 * 100
    - Speed_norm = clamp(1 - MTTR_hours / target_hours, 0, 1) * 100
    - Reopen%: percentage of resolved tickets that were reopened

    Composite score:
    clamp(0.4 * SLA% + 0.3 * CSAT_norm + 0.3 * Speed_norm - Reopen%, 0, 100)
    """

    @classmethod
    def calculate_composite_score(
        cls,
        sla_percentage: float,
        avg_csat: float,
        mttr_hours: float,
        target_hours: float = 48.0,
        reopen_rate_percent: float = 0.0,
    ) -> CompositeKPIResult:
        sla_clean = min(max(sla_percentage, 0.0), 100.0)

        # CSAT (1 to 5 scale) to 0-100
        csat_clean = min(max(avg_csat, 1.0), 5.0)
        csat_norm = ((csat_clean - 1.0) / 4.0) * 100.0

        # Speed normalized: 0 MTTR -> 100 speed; target MTTR -> 0 speed
        if target_hours <= 0:
            target_hours = 48.0
        speed_ratio = max(0.0, min(1.0, 1.0 - (mttr_hours / target_hours)))
        speed_norm = speed_ratio * 100.0

        # Reopen penalty
        reopen_clean = min(max(reopen_rate_percent, 0.0), 100.0)

        raw_score = (0.4 * sla_clean) + (0.3 * csat_norm) + (0.3 * speed_norm) - reopen_clean
        final_score = min(max(raw_score, 0.0), 100.0)

        return CompositeKPIResult(
            score=round(final_score, 2),
            sla_percentage=round(sla_clean, 2),
            csat_normalized=round(csat_norm, 2),
            speed_normalized=round(speed_norm, 2),
            reopen_penalty=round(reopen_clean, 2),
        )
