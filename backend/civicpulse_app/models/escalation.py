import uuid
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy import (
    String,
    Integer,
    Float,
    Boolean,
    ForeignKey,
    DateTime,
    text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from civicpulse_app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Escalation(Base, UUIDPrimaryKeyMixin):
    """
    Records every escalation level transition for an issue.
    Level 1: CSI/AE warning + KPI penalty.
    Level 2: Zonal Officer + ICCC Red List.
    Level 3: Show-cause notice draft recommendation to HOD.
    """
    __tablename__ = "escalations"

    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("civic_issues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    level: Mapped[int] = mapped_column(Integer, nullable=False)  # 1, 2, or 3
    at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
        index=True,
    )
    notified_parties: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)


class KPIEvent(Base, UUIDPrimaryKeyMixin):
    """
    Ledger for inspector KPI adjustments.
    Prevents race conditions; aggregate to compute composite KPI score.
    """
    __tablename__ = "kpi_events"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    issue_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("civic_issues.id", ondelete="SET NULL"),
        nullable=True,
    )
    delta_score: Mapped[float] = mapped_column(Float, nullable=False)  # e.g. -5.0 for L1 breach
    reason: Mapped[str] = mapped_column(String(200), nullable=False)
    at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
    )


class ShowCauseRecommendation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Decision D7: System only drafts/recommends show-cause; human HOD issues it.
    """
    __tablename__ = "show_cause_recommendations"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("civic_issues.id", ondelete="CASCADE"),
        nullable=False,
    )
    draft_letter: Mapped[str] = mapped_column(String(2000), nullable=False)
    is_reviewed_by_hod: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    hod_action: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # ISSUED, DISMISSED, WARNED
