from pydantic import BaseModel, Field
from typing import Optional, List
import uuid
from datetime import datetime
from civicpulse_app.domain.enums import IssueStatus, PriorityLevel, Department


class IssueCreateRequest(BaseModel):
    capture_nonce: str
    title: str = Field(..., max_length=200)
    category: str = Field(..., max_length=50)  # Pothole, Garbage_Dump, etc.
    department: Optional[Department] = Department.GENERAL
    longitude: float = Field(..., ge=-180.0, le=180.0)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    accuracy_m: float = Field(..., le=50.0)  # Accuracy must be reasonable
    image_base64_or_key: str
    note: Optional[str] = Field(None, max_length=500)
    device_id: str


class IssueSubmitResponse(BaseModel):
    ticket_code: str
    issue_id: uuid.UUID
    status: IssueStatus
    is_duplicate: bool
    merged_with: Optional[str] = None
    message: str


class NearbyIssueItem(BaseModel):
    id: uuid.UUID
    ticket_code: str
    title: str
    category: str
    status: IssueStatus
    priority: PriorityLevel
    longitude: float
    latitude: float
    distance_metres: float
    upvote_count: int
    created_at: datetime
