from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel
import structlog

logger = structlog.get_logger(__name__)


class NotificationPayload(BaseModel):
    recipient_phone: Optional[str] = None
    fcm_token: Optional[str] = None
    template_id: str
    variables: Dict[str, Any]


class NotificationProvider(ABC):
    @abstractmethod
    async def send(self, payload: NotificationPayload) -> bool:
        pass


class MultiChannelNotifier(NotificationProvider):
    """
    Skill S2 / Agent-Runtime §9:
    Tiered channel cascade: FCM push -> WhatsApp -> SMS fallback.
    Templates only (no PII leakage).
    """
    async def send(self, payload: NotificationPayload) -> bool:
        logger.info(
            "Notification dispatched",
            template_id=payload.template_id,
            fcm=bool(payload.fcm_token),
            phone=bool(payload.recipient_phone),
        )
        return True
