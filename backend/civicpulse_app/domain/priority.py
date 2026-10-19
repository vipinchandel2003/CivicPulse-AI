from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from civicpulse_app.domain.enums import PriorityLevel


class PriorityResult(BaseModel):
    score: float
    priority: PriorityLevel
    sla_hours: int
    sla_deadline: datetime
    hard_override_triggered: bool
    override_reason: Optional[str] = None
    components: Dict[str, float]


class PriorityScoringEngine:
    """
    Skill S3 / Research D4:
    C_vision = 100 * conf * (0.6 * class_weight + 0.4 * min(bbox_ratio / 0.25, 1.0))
    S = 0.35 * C_vision + 0.25 * U_nlp + 0.25 * P_spatial + 0.15 * min(upvotes * 10, 100)

    Hard overrides:
    Open_Manhole OR live-wire/sparking OR main-road blockage -> ALWAYS CRITICAL.

    SLA mapping:
    CRITICAL (S >= 80 or override): 4 - 6 hours
    HIGH (60 <= S < 80): 12 - 24 hours
    STANDARD (S < 60): 48 - 72 hours
    """

    CLASS_WEIGHTS: Dict[str, float] = {
        "Open_Manhole": 1.0,
        "Live_Wire": 1.0,
        "Pothole": 0.7,
        "Water_Leakage": 0.6,
        "Garbage_Dump": 0.5,
        "Broken_Streetlight": 0.4,
        "Unknown": 0.3,
    }

    @classmethod
    def compute_priority(
        cls,
        category: str,
        confidence: float,
        bbox_ratio: float,
        nlp_urgency: float,
        spatial_proximity_score: float,
        upvote_count: int,
        hazard_keywords: Optional[List[str]] = None,
        base_time: Optional[datetime] = None,
    ) -> PriorityResult:
        if base_time is None:
            base_time = datetime.now(timezone.utc)

        hazard_keywords = [h.lower() for h in (hazard_keywords or [])]

        # Check Hard Overrides first
        is_override = False
        override_reason = None

        if category == "Open_Manhole" or "open_manhole" in hazard_keywords or "manhole" in hazard_keywords:
            is_override = True
            override_reason = "Open manhole hazard detected (immediate fatality risk)"
        elif category == "Live_Wire" or any(k in hazard_keywords for k in ["sparking", "live_wire", "wire", "shock"]):
            is_override = True
            override_reason = "Live electric wire / sparking hazard detected"
        elif "accident" in hazard_keywords or "main_road_blockage" in hazard_keywords:
            is_override = True
            override_reason = "Main arterial road obstruction / accident risk"

        # Vision component
        class_weight = cls.CLASS_WEIGHTS.get(category, 0.4)
        c_vision = 100.0 * confidence * (0.6 * class_weight + 0.4 * min(bbox_ratio / 0.25, 1.0))
        c_vision = min(max(c_vision, 0.0), 100.0)

        # NLP component (0 - 100)
        u_nlp = min(max(nlp_urgency, 0.0), 100.0)

        # Spatial component (0 - 100 based on proximity to school/hospital/arterial)
        p_spatial = min(max(spatial_proximity_score, 0.0), 100.0)

        # Upvote term
        upvote_term = min(max(upvote_count, 1) * 10.0, 100.0)

        # Composite score
        score = 0.35 * c_vision + 0.25 * u_nlp + 0.25 * p_spatial + 0.15 * upvote_term
        score = round(score, 2)

        if is_override or score >= 80.0:
            priority = PriorityLevel.CRITICAL
            sla_hours = 6
        elif score >= 60.0:
            priority = PriorityLevel.HIGH
            sla_hours = 24
        else:
            priority = PriorityLevel.STANDARD
            sla_hours = 48

        sla_deadline = base_time + timedelta(hours=sla_hours)

        return PriorityResult(
            score=score,
            priority=priority,
            sla_hours=sla_hours,
            sla_deadline=sla_deadline,
            hard_override_triggered=is_override,
            override_reason=override_reason,
            components={
                "c_vision": round(c_vision, 2),
                "u_nlp": round(u_nlp, 2),
                "p_spatial": round(p_spatial, 2),
                "upvote_term": round(upvote_term, 2),
            },
        )
