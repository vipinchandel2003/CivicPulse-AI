import pytest
from civicpulse_app.domain.verification import VerificationService


def test_verification_honest_pass():
    res = VerificationService.verify_resolution(
        clip_similarity=0.82,
        target_defect_detected=False,
        phash_reused=False,
    )
    assert res.passed is True
    assert res.status == "RESOLVED"


def test_verification_phash_reuse_reject():
    res = VerificationService.verify_resolution(
        clip_similarity=0.90,
        target_defect_detected=False,
        phash_reused=True,
    )
    assert res.passed is False
    assert res.status == "PENDING_REVIEW"
    assert "Perceptual hash collision" in res.reason


def test_verification_low_background_similarity_reject():
    res = VerificationService.verify_resolution(
        clip_similarity=0.60,  # Below 0.75
        target_defect_detected=False,
        phash_reused=False,
    )
    assert res.passed is False
    assert res.status == "PENDING_REVIEW"
    assert "below threshold" in res.reason


def test_verification_defect_still_present_reject():
    res = VerificationService.verify_resolution(
        clip_similarity=0.88,
        target_defect_detected=True,  # Defect not cleared
        phash_reused=False,
    )
    assert res.passed is False
    assert res.status == "PENDING_REVIEW"
    assert "still detected" in res.reason
