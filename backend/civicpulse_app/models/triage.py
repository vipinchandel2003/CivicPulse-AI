import uuid
from typing import Optional, List
from sqlalchemy import String, Integer, Float, Boolean, JSON, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geography

from civicpulse_app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Place(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Critical infrastructure points: hospitals, schools, major arterial junctions.
    Used to compute P_spatial proximity score.
    """
    __tablename__ = "places"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    place_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # hospital, school, arterial
    location: Mapped[str] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )


class SLAPolicy(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Configurable SLA targets per priority and category.
    Never hardcode SLA hours in code.
    """
    __tablename__ = "sla_policies"

    priority: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # CRITICAL, HIGH, STANDARD
    category: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # Pothole, Open_Manhole, etc.
    target_hours_min: Mapped[int] = mapped_column(Integer, nullable=False)
    target_hours_max: Mapped[int] = mapped_column(Integer, nullable=False)
    pause_rules: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)


class AIInferenceLog(Base, UUIDPrimaryKeyMixin):
    """
    Auditable log of every AI inference call: model version, latency, raw output.
    """
    __tablename__ = "ai_inference_log"

    issue_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    agent_name: Mapped[str] = mapped_column(String(50), nullable=False)  # Vision, NLP, Priority
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    input_payload: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    output_payload: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[str] = mapped_column(server_default=text("now()"), nullable=False)
