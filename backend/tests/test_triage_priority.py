import pytest
from civicpulse_app.domain.priority import PriorityScoringEngine
from civicpulse_app.domain.enums import PriorityLevel
from civicpulse_app.ai.nlp import KeywordFallbackNlpProvider
from civicpulse_app.ai.detector import MockYoloDetectorProvider


def test_open_manhole_hard_override_always_critical():
    """
    Research D4 / S3: Open manhole must ALWAYS trigger CRITICAL (6h SLA)
    regardless of whether NLP or upvotes are 0.
    """
    res = PriorityScoringEngine.compute_priority(
        category="Open_Manhole",
        confidence=0.9,
        bbox_ratio=0.1,
        nlp_urgency=0.0,
        spatial_proximity_score=0.0,
        upvote_count=1,
    )
    assert res.priority == PriorityLevel.CRITICAL
    assert res.hard_override_triggered is True
    assert res.sla_hours == 6


def test_live_wire_hazard_override():
    """
    Hazard keywords indicating sparking or live wire force CRITICAL.
    """
    res = PriorityScoringEngine.compute_priority(
        category="Pothole",
        confidence=0.5,
        bbox_ratio=0.05,
        nlp_urgency=90.0,
        spatial_proximity_score=20.0,
        upvote_count=1,
        hazard_keywords=["sparking", "live_wire"],
    )
    assert res.priority == PriorityLevel.CRITICAL
    assert res.hard_override_triggered is True
    assert "Live electric wire" in res.override_reason


def test_standard_priority_for_minor_defect():
    """
    Minor defect with low urgency and low upvotes maps to STANDARD (48h).
    """
    res = PriorityScoringEngine.compute_priority(
        category="Garbage_Dump",
        confidence=0.6,
        bbox_ratio=0.05,
        nlp_urgency=10.0,
        spatial_proximity_score=0.0,
        upvote_count=1,
    )
    assert res.priority == PriorityLevel.STANDARD
    assert res.sla_hours == 48
    assert res.hard_override_triggered is False


@pytest.mark.asyncio
async def test_hinglish_keyword_extraction():
    provider = KeywordFallbackNlpProvider()
    note = "Bhai Rajwada chowk ke paas khula gutter hai bache gir sakte hain accident ho sakta hai"
    result = await provider.extract(note)

    assert "open_manhole" in result.hazards
    assert "accident" in result.hazards
    assert "school" in result.hazards  # bache triggers school/children
    assert result.urgency >= 80


@pytest.mark.asyncio
async def test_mock_yolo_golden_detection():
    detector = MockYoloDetectorProvider()
    res = await detector.detect("sample_manhole_test.jpg")
    assert res.primary_category == "Open_Manhole"
    assert res.confidence >= 0.9
