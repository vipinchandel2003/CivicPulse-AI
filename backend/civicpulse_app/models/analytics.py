import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import (
    String,
    Integer,
    Float,
    ForeignKey,
    DateTime,
    text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geography

from civicpulse_app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ChronicSpot(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Superpower 8: Chronic Blackspot Detection.
    Flags locations with >= 5 reports of same category within 50m in 30 days.
    """
    __tablename__ = "chronic_spots"

    category: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    ward_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("wards.id", ondelete="SET NULL"),
        nullable=True,
    )
    center_location: Mapped[str] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    incident_count: Mapped[int] = mapped_column(Integer, nullable=False)
    first_incident_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_incident_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    root_cause_notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)


class KPISnapshot(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Monthly snapshot of normalized KPI scores per inspector / ward.
    Formula (Skill S11):
    clamp(0.4*SLA% + 0.3*CSAT_norm + 0.3*Speed_norm - Reopen%, 0, 100)
    """
    __tablename__ = "kpi_snapshots"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    period: Mapped[str] = mapped_column(String(7), nullable=False, index=True)  # YYYY-MM
    composite_kpi: Mapped[float] = mapped_column(Float, nullable=False)
    sla_percentage: Mapped[float] = mapped_column(Float, nullable=False)
    avg_csat: Mapped[float] = mapped_column(Float, nullable=False)
    mttr_hours: Mapped[float] = mapped_column(Float, nullable=False)
    reopen_rate_percent: Mapped[float] = mapped_column(Float, nullable=False)
    rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
