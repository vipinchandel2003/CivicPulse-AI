import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy import (
    String,
    Integer,
    Float,
    Boolean,
    ForeignKey,
    DateTime,
    Enum,
    UniqueConstraint,
    Index,
    JSON,
    text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geography, Geometry
from pgvector.sqlalchemy import Vector

from civicpulse_app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from civicpulse_app.domain.enums import IssueStatus, PriorityLevel, Department


class CivicIssue(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "civic_issues"

    ticket_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    category: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    department: Mapped[Department] = mapped_column(
        Enum(Department, name="department_enum"),
        nullable=False,
    )
    # PostGIS Geography(Point, 4326) for true meter distance calculations
    location: Mapped[str] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    ward_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("wards.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[IssueStatus] = mapped_column(
        Enum(IssueStatus, name="issue_status_enum"),
        default=IssueStatus.RECEIVED,
        nullable=False,
        index=True,
    )
    priority: Mapped[PriorityLevel] = mapped_column(
        Enum(PriorityLevel, name="priority_level_enum"),
        default=PriorityLevel.STANDARD,
        nullable=False,
        index=True,
    )
    severity_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    sla_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    escalation_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    master_issue_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("civic_issues.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    merged_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    upvote_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    ai_audit_passed: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    fraud_flag: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    reports: Mapped[List["IssueReport"]] = relationship("IssueReport", back_populates="issue", cascade="all, delete-orphan")
    media: Mapped[List["IssueMedia"]] = relationship("IssueMedia", back_populates="issue", cascade="all, delete-orphan")
    upvotes: Mapped[List["IssueUpvote"]] = relationship("IssueUpvote", back_populates="issue", cascade="all, delete-orphan")
    events: Mapped[List["IssueEvent"]] = relationship("IssueEvent", back_populates="issue", cascade="all, delete-orphan")


class IssueReport(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "issue_reports"

    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("civic_issues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reporter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_key: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    accuracy_m: Mapped[float] = mapped_column(Float, nullable=False)
    note: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    device_id: Mapped[str] = mapped_column(String(128), nullable=False)

    issue: Mapped["CivicIssue"] = relationship("CivicIssue", back_populates="reports")


class IssueMedia(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "issue_media"

    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("civic_issues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    kind: Mapped[str] = mapped_column(String(20), nullable=False)  # BEFORE or AFTER
    key: Mapped[str] = mapped_column(String(255), nullable=False)
    phash: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    clip_embedding: Mapped[Optional[List[float]]] = mapped_column(Vector(512), nullable=True)

    issue: Mapped["CivicIssue"] = relationship("CivicIssue", back_populates="media")


class IssueUpvote(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "issue_upvotes"

    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("civic_issues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    issue: Mapped["CivicIssue"] = relationship("CivicIssue", back_populates="upvotes")

    __table_args__ = (
        UniqueConstraint("issue_id", "user_id", name="uq_issue_user_upvote"),
    )


class IssueEvent(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "issue_events"

    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("civic_issues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    from_status: Mapped[Optional[IssueStatus]] = mapped_column(
        Enum(IssueStatus, name="issue_status_enum"),
        nullable=True,
    )
    to_status: Mapped[Optional[IssueStatus]] = mapped_column(
        Enum(IssueStatus, name="issue_status_enum"),
        nullable=True,
    )
    payload: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
        index=True,
    )

    issue: Mapped["CivicIssue"] = relationship("CivicIssue", back_populates="events")
