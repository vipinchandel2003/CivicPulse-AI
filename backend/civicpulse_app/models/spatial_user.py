import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy import (
    String,
    Integer,
    Boolean,
    ForeignKey,
    DateTime,
    Enum,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry
from civicpulse_app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from civicpulse_app.domain.enums import UserRole, Department


class Zone(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "zones"

    zone_number: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    # Using MultiPolygon in SRID 4326 for zone boundary
    boundary: Mapped[str] = mapped_column(
        Geometry(geometry_type="MULTIPOLYGON", srid=4326, spatial_index=True),
        nullable=True,
    )

    wards: Mapped[List["Ward"]] = relationship("Ward", back_populates="zone", cascade="all, delete-orphan")


class Ward(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "wards"

    ward_number: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    zone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("zones.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # MultiPolygon in SRID 4326 with GIST spatial index
    boundary: Mapped[str] = mapped_column(
        Geometry(geometry_type="MULTIPOLYGON", srid=4326, spatial_index=True),
        nullable=False,
    )

    zone: Mapped["Zone"] = relationship("Zone", back_populates="wards")
    user_assignments: Mapped[List["UserWardAssignment"]] = relationship(
        "UserWardAssignment",
        back_populates="ward",
        cascade="all, delete-orphan",
    )


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role_enum"),
        default=UserRole.CITIZEN,
        nullable=False,
        index=True,
    )
    department: Mapped[Optional[Department]] = mapped_column(
        Enum(Department, name="department_enum"),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    on_duty: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_seen: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    ward_assignments: Mapped[List["UserWardAssignment"]] = relationship(
        "UserWardAssignment",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    devices: Mapped[List["Device"]] = relationship(
        "Device",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class UserWardAssignment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_ward_assignments"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ward_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("wards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user: Mapped["User"] = relationship("User", back_populates="ward_assignments")
    ward: Mapped["Ward"] = relationship("Ward", back_populates="user_assignments")

    __table_args__ = (
        UniqueConstraint("user_id", "ward_id", name="uq_user_ward"),
    )


class Device(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "devices"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    device_id: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    platform: Mapped[str] = mapped_column(String(20), nullable=False)  # android, ios, web
    fcm_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_trusted: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_active: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="devices")
