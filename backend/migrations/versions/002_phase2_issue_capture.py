"""create issue capture and dedup tables

Revision ID: 002_phase2_issue_capture
Revises: 001_phase1_spatial_user
Create Date: 2026-10-18 11:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from geoalchemy2 import Geography
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = '002_phase2_issue_capture'
down_revision: Union[str, None] = '001_phase1_spatial_user'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # Issue status enum
    issue_status_enum = postgresql.ENUM(
        'RECEIVED', 'MERGED', 'TRIAGED', 'ASSIGNED', 'UNROUTED', 'IN_PROGRESS',
        'PENDING_AUDIT', 'PENDING_REVIEW', 'RESOLVED', 'REOPENED',
        name='issue_status_enum'
    )
    issue_status_enum.create(op.get_bind(), checkfirst=True)

    # Priority level enum
    priority_level_enum = postgresql.ENUM(
        'CRITICAL', 'HIGH', 'STANDARD',
        name='priority_level_enum'
    )
    priority_level_enum.create(op.get_bind(), checkfirst=True)

    # Civic issues table
    op.create_table(
        'civic_issues',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('ticket_code', sa.String(length=64), nullable=False, unique=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('department', sa.Enum('SOLID_WASTE', 'ROADS_DRAINAGE', 'ELECTRICAL', 'WATER_WORKS', 'GENERAL', name='department_enum'), nullable=False),
        sa.Column('location', Geography(geometry_type='POINT', srid=4326, spatial_index=True), nullable=False),
        sa.Column('ward_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('wards.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.Enum('RECEIVED', 'MERGED', 'TRIAGED', 'ASSIGNED', 'UNROUTED', 'IN_PROGRESS', 'PENDING_AUDIT', 'PENDING_REVIEW', 'RESOLVED', 'REOPENED', name='issue_status_enum'), nullable=False, server_default='RECEIVED'),
        sa.Column('priority', sa.Enum('CRITICAL', 'HIGH', 'STANDARD', name='priority_level_enum'), nullable=False, server_default='STANDARD'),
        sa.Column('severity_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('sla_deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('escalation_level', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('master_issue_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('civic_issues.id', ondelete='SET NULL'), nullable=True),
        sa.Column('merged_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('upvote_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('ai_audit_passed', sa.Boolean(), nullable=True),
        sa.Column('fraud_flag', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_civic_issues_ticket_code', 'civic_issues', ['ticket_code'])
    op.create_index('ix_civic_issues_category', 'civic_issues', ['category'])
    op.create_index('ix_civic_issues_status', 'civic_issues', ['status'])
    op.create_index('ix_civic_issues_priority', 'civic_issues', ['priority'])
    op.create_index('ix_civic_issues_sla_deadline', 'civic_issues', ['sla_deadline'])
    op.create_index('ix_civic_issues_ward_id', 'civic_issues', ['ward_id'])
    op.create_index('ix_civic_issues_master_issue_id', 'civic_issues', ['master_issue_id'])
    op.create_index('ix_civic_issues_assigned_to', 'civic_issues', ['assigned_to'])

    # Issue reports table
    op.create_table(
        'issue_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('issue_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('civic_issues.id', ondelete='CASCADE'), nullable=False),
        sa.Column('reporter_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('image_key', sa.String(length=255), nullable=False),
        sa.Column('location', Geography(geometry_type='POINT', srid=4326, spatial_index=True), nullable=False),
        sa.Column('accuracy_m', sa.Float(), nullable=False),
        sa.Column('note', sa.String(length=500), nullable=True),
        sa.Column('captured_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('device_id', sa.String(length=128), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_issue_reports_issue_id', 'issue_reports', ['issue_id'])
    op.create_index('ix_issue_reports_reporter_id', 'issue_reports', ['reporter_id'])

    # Issue media table (with pgvector embedding support)
    op.create_table(
        'issue_media',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('issue_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('civic_issues.id', ondelete='CASCADE'), nullable=False),
        sa.Column('kind', sa.String(length=20), nullable=False),
        sa.Column('key', sa.String(length=255), nullable=False),
        sa.Column('phash', sa.String(length=64), nullable=True),
        sa.Column('clip_embedding', Vector(512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_issue_media_issue_id', 'issue_media', ['issue_id'])
    op.create_index('ix_issue_media_phash', 'issue_media', ['phash'])

    # Issue upvotes table
    op.create_table(
        'issue_upvotes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('issue_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('civic_issues.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('issue_id', 'user_id', name='uq_issue_user_upvote'),
    )
    op.create_index('ix_issue_upvotes_issue_id', 'issue_upvotes', ['issue_id'])
    op.create_index('ix_issue_upvotes_user_id', 'issue_upvotes', ['user_id'])

    # Issue events table (immutable audit trail)
    op.create_table(
        'issue_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('issue_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('civic_issues.id', ondelete='CASCADE'), nullable=False),
        sa.Column('actor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('from_status', sa.Enum('RECEIVED', 'MERGED', 'TRIAGED', 'ASSIGNED', 'UNROUTED', 'IN_PROGRESS', 'PENDING_AUDIT', 'PENDING_REVIEW', 'RESOLVED', 'REOPENED', name='issue_status_enum'), nullable=True),
        sa.Column('to_status', sa.Enum('RECEIVED', 'MERGED', 'TRIAGED', 'ASSIGNED', 'UNROUTED', 'IN_PROGRESS', 'PENDING_AUDIT', 'PENDING_REVIEW', 'RESOLVED', 'REOPENED', name='issue_status_enum'), nullable=True),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_issue_events_issue_id', 'issue_events', ['issue_id'])
    op.create_index('ix_issue_events_at', 'issue_events', ['at'])


def downgrade() -> None:
    op.drop_table('issue_events')
    op.drop_table('issue_upvotes')
    op.drop_table('issue_media')
    op.drop_table('issue_reports')
    op.drop_table('civic_issues')
    op.execute('DROP TYPE IF EXISTS priority_level_enum;')
    op.execute('DROP TYPE IF EXISTS issue_status_enum;')
