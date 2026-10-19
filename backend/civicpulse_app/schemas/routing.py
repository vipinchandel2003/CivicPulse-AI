import uuid
from pydantic import BaseModel
from typing import Optional


class ReassignRequest(BaseModel):
    new_inspector_id: uuid.UUID
    reason: str


class DutyToggleRequest(BaseModel):
    on_duty: bool


class InspectorTaskItem(BaseModel):
    id: uuid.UUID
    ticket_code: str
    title: str
    category: str
    priority: str
    status: str
    sla_deadline: Optional[str] = None
    created_at: str
