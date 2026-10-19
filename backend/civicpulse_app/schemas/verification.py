from pydantic import BaseModel, Field
from typing import Optional
import uuid


class ResolveIssueRequest(BaseModel):
    capture_nonce: str
    longitude: float = Field(..., ge=-180.0, le=180.0)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    accuracy_m: float = Field(..., le=20.0, description="Strict accuracy required for resolution: <= 20m")
    is_mock_location: bool = Field(False, description="Flag read from native Android Location API")
    device_attestation_token: Optional[str] = None
    after_image_key: str
    perceptual_hash: Optional[str] = None
    resolution_notes: Optional[str] = Field(None, max_length=500)


class ReviewDecisionRequest(BaseModel):
    decision: str = Field(..., pattern="^(APPROVE|REJECT)$")
    rejection_reason: Optional[str] = None


class CitizenReopenRequest(BaseModel):
    reopen_reason: str = Field(..., min_length=5, max_length=500)


class CSATSubmissionRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = Field(None, max_length=500)
