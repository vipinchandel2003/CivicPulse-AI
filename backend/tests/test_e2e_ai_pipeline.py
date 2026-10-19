import asyncio
import os
import pytest
from civicpulse_app.ai.nlp import GeminiNlpProvider, KeywordFallbackNlpProvider
from civicpulse_app.ai.detector import UltralyticsYoloDetectorProvider, MockYoloDetectorProvider
from civicpulse_app.ai.embedder import ClipEmbeddingService
from civicpulse_app.domain.priority import PriorityScoringEngine
from civicpulse_app.domain.enums import PriorityLevel
from civicpulse_app.domain.verification import VerificationService


@pytest.mark.asyncio
async def test_end_to_end_ai_triage_flow_open_manhole():
    """
    Scenario 1: Open Manhole Emergency Report (Hindi / Hinglish text)
    Citizen Note: "Bhai Rajwada square ke samne khula manhole hai bache gir sakte hain accident ho sakta hai"
    Expected:
    - NLP extracts 'open_manhole', 'accident', high urgency
    - YOLO detects 'Open_Manhole' with bounding box
    - Priority Engine triggers HARD OVERRIDE -> CRITICAL priority, 6-hour SLA
    """
    # 1. NLP Step
    nlp_provider = KeywordFallbackNlpProvider()
    nlp_res = await nlp_provider.extract("Bhai Rajwada square ke samne khula manhole hai bache gir sakte hain accident ho sakta hai")
    
    assert "open_manhole" in nlp_res.hazards
    assert "accident" in nlp_res.hazards
    assert nlp_res.urgency >= 80

    # 2. Vision Step
    vision_provider = UltralyticsYoloDetectorProvider()
    detection = await vision_provider.detect("manhole_street_live_photo.jpg")
    
    assert detection.primary_category == "Open_Manhole"
    assert detection.confidence >= 0.90
    assert detection.bbox_ratio > 0.0

    # 3. Priority Engine Math Step (Skill S3)
    priority_res = PriorityScoringEngine.compute_priority(
        category=detection.primary_category,
        confidence=detection.confidence,
        bbox_ratio=detection.bbox_ratio,
        nlp_urgency=float(nlp_res.urgency),
        spatial_proximity_score=40.0,
        upvote_count=1,
        hazard_keywords=nlp_res.hazards,
    )

    assert priority_res.priority == PriorityLevel.CRITICAL
    assert priority_res.sla_hours == 6
    assert priority_res.hard_override_triggered is True
    assert "Open manhole hazard" in priority_res.override_reason


@pytest.mark.asyncio
async def test_end_to_end_ai_triage_flow_standard_pothole():
    """
    Scenario 2: Routine Pothole Report (Low Urgency)
    Citizen Note: "Minor pothole on colony inner lane"
    Expected:
    - Standard Priority, 48-hour SLA, no hard overrides triggered
    """
    nlp_provider = KeywordFallbackNlpProvider()
    nlp_res = await nlp_provider.extract("Minor pothole on colony inner lane")
    
    vision_provider = UltralyticsYoloDetectorProvider()
    detection = await vision_provider.detect("colony_road_pothole.jpg")
    
    priority_res = PriorityScoringEngine.compute_priority(
        category=detection.primary_category,
        confidence=detection.confidence,
        bbox_ratio=detection.bbox_ratio,
        nlp_urgency=float(nlp_res.urgency),
        spatial_proximity_score=0.0,
        upvote_count=1,
        hazard_keywords=nlp_res.hazards,
    )

    assert priority_res.priority == PriorityLevel.STANDARD
    assert priority_res.sla_hours == 48
    assert priority_res.hard_override_triggered is False


def test_end_to_end_proof_of_work_verification_flow():
    """
    Scenario 3: Field Inspector Resolution Proof-of-Work Verification (Skill S7)
    Before Photo vs After Photo:
    1. CLIP Embedding generated for Before Photo
    2. CLIP Embedding generated for After Photo
    3. Cosine similarity compared against 0.75 threshold
    4. Target defect absence checked
    """
    embedder = ClipEmbeddingService()

    # Case A: Honest resolution (same spot verified, defect absent)
    vec_before = embedder.compute_embedding("palasia_ward_manhole_angle_north")
    vec_after = embedder.compute_embedding("palasia_ward_manhole_angle_north")
    
    sim_score = embedder.cosine_similarity(vec_before, vec_after)
    assert sim_score >= 0.75  # Passes background consistency

    v_pass = VerificationService.verify_resolution(
        clip_similarity=sim_score,
        target_defect_detected=False,  # Clear
        phash_reused=False,
    )
    assert v_pass.passed is True
    assert v_pass.status == "RESOLVED"

    # Case B: Fraudulent resolution (photo of a completely different place)
    vec_fake_after = embedder.compute_embedding("completely_unrelated_office_ceiling_photo")
    fake_sim = embedder.cosine_similarity(vec_before, vec_fake_after)
    
    v_fail = VerificationService.verify_resolution(
        clip_similarity=fake_sim,
        target_defect_detected=False,
        phash_reused=False,
    )
    assert v_fail.passed is False
    assert v_fail.status == "PENDING_REVIEW"
    assert "below threshold" in v_fail.reason
