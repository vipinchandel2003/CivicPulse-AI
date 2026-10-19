"""create spatial hierarchy and user tables

Revision ID: 001_phase1_spatial_user
Revises: 
Create Date: 2026-10-18 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision: str = '001_phase1_spatial_user'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure extensions are active
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")

    # Enums
    user_role_enum = postgresql.ENUM(
        'CITIZEN', 'FIELD_INSPECTOR', 'WARD_CSI', 'ZONAL_OFFICER', 'DEPT_HOD', 'SUPER_ADMIN',
        name='user_role_enum'
    )
    user_role_enum.create(op.get_bind(), checkfirst=True)

    department_enum = postgresql.ENUM(
        'SOLID_WASTE', 'ROADS_DRAINAGE', 'ELECTRICAL', 'WATER_WORKS', 'GENERAL',
        name='department_enum'
    )
    department_enum.create(op.get_bind(), checkfirst=True)

    # Zones table
    op.create_table(
        'zones',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('zone_number', sa.Integer(), nullable=False, unique=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('boundary', Geometry(geometry_type='MULTIPOLYGON', srid=4326, spatial_index=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_zones_zone_number', 'zones', ['zone_number'])

    # Wards table
    op.create_table(
        'wards',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('ward_number', sa.Integer(), nullable=False, unique=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('zone_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('zones.id', ondelete='CASCADE'), nullable=False),
        sa.Column('boundary', Geometry(geometry_type='MULTIPOLYGON', srid=4326, spatial_index=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_wards_ward_number', 'wards', ['ward_number'])
    op.create_index('ix_wards_zone_id', 'wards', ['zone_id'])

    # Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('phone', sa.String(length=20), nullable=False, unique=True),
        sa.Column('full_name', sa.String(length=100), nullable=True),
        sa.Column('role', sa.Enum('CITIZEN', 'FIELD_INSPECTOR', 'WARD_CSI', 'ZONAL_OFFICER', 'DEPT_HOD', 'SUPER_ADMIN', name='user_role_enum'), nullable=False, server_default='CITIZEN'),
        sa.Column('department', sa.Enum('SOLID_WASTE', 'ROADS_DRAINAGE', 'ELECTRICAL', 'WATER_WORKS', 'GENERAL', name='department_enum'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('on_duty', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('last_seen', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_users_phone', 'users', ['phone'])
    op.create_index('ix_users_role', 'users', ['role'])

    # User Ward Assignments table
    op.create_table(
        'user_ward_assignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('ward_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('wards.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('user_id', 'ward_id', name='uq_user_ward'),
    )
    op.create_index('ix_user_ward_assignments_user_id', 'user_ward_assignments', ['user_id'])
    op.create_index('ix_user_ward_assignments_ward_id', 'user_ward_assignments', ['ward_id'])

    # Devices table
    op.create_table(
        'devices',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('device_id', sa.String(length=128), nullable=False, unique=True),
        sa.Column('platform', sa.String(length=20), nullable=False),
        sa.Column('fcm_token', sa.String(length=255), nullable=True),
        sa.Column('is_trusted', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('last_active', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_devices_device_id', 'devices', ['device_id'])
    op.create_index('ix_devices_user_id', 'devices', ['user_id'])


def downgrade() -> None:
    op.drop_table('devices')
    op.drop_table('user_ward_assignments')
    op.drop_table('users')
    op.drop_table('wards')
    op.drop_table('zones')
    op.execute('DROP TYPE IF EXISTS department_enum;')
    op.execute('DROP TYPE IF EXISTS user_role_enum;')
