import uuid
from typing import Optional, Tuple
from pydantic import BaseModel


class VerificationResult(BaseModel):
    passed: bool
    clip_similarity: float
    target_absent: bool
    status: str  # RESOLVED or PENDING_REVIEW
    reason: str


class VerificationService:
    """
    Skill S7 / Agent-Runtime §7:
    Verification Agent checks:
    1. CLIP background similarity (Before vs After) >= threshold (e.g. 0.75).
    2. YOLO target absence (target defect class not detected in After photo).
    3. Perceptual hash not reused from previous tickets.
    """
    CLIP_BACKGROUND_THRESHOLD = 0.75

    @classmethod
    def verify_resolution(
        cls,
        clip_similarity: float,
        target_defect_detected: bool,
        phash_reused: bool = False,
    ) -> VerificationResult:
        if phash_reused:
            return VerificationResult(
                passed=False,
                clip_similarity=clip_similarity,
                target_absent=not target_defect_detected,
                status="PENDING_REVIEW",
                reason="Perceptual hash collision: After photo matches a previously submitted image.",
            )

        if clip_similarity < cls.CLIP_BACKGROUND_THRESHOLD:
            return VerificationResult(
                passed=False,
                clip_similarity=clip_similarity,
                target_absent=not target_defect_detected,
                status="PENDING_REVIEW",
                reason=f"Background similarity ({clip_similarity:.2f}) below threshold ({cls.CLIP_BACKGROUND_THRESHOLD}). Possible wrong location.",
            )

        if target_defect_detected:
            return VerificationResult(
                passed=False,
                clip_similarity=clip_similarity,
                target_absent=False,
                status="PENDING_REVIEW",
                reason="Target defect is still detected in After photo. Incomplete resolution.",
            )

        return VerificationResult(
            passed=True,
            clip_similarity=clip_similarity,
            target_absent=True,
            status="RESOLVED",
            reason="Proof-of-work verified: Background matches and defect is cleared.",
        )
