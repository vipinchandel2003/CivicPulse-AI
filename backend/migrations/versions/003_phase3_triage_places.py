"""create places and sla_policies tables

Revision ID: 003_phase3_triage_places
Revises: 002_phase2_issue_capture
Create Date: 2026-10-18 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from geoalchemy2 import Geography

# revision identifiers, used by Alembic.
revision: str = '003_phase3_triage_places'
down_revision: Union[str, None] = '002_phase2_issue_capture'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Places table (schools, hospitals, arterial junctions)
    op.create_table(
        'places',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('place_type', sa.String(length=50), nullable=False),
        sa.Column('location', Geography(geometry_type='POINT', srid=4326, spatial_index=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_places_place_type', 'places', ['place_type'])

    # SLA policies table
    op.create_table(
        'sla_policies',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('priority', sa.String(length=20), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('target_hours_min', sa.Integer(), nullable=False),
        sa.Column('target_hours_max', sa.Integer(), nullable=False),
        sa.Column('pause_rules', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_sla_policies_priority', 'sla_policies', ['priority'])
    op.create_index('ix_sla_policies_category', 'sla_policies', ['category'])

    # AI inference log
    op.create_table(
        'ai_inference_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('issue_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('agent_name', sa.String(length=50), nullable=False),
        sa.Column('model_name', sa.String(length=100), nullable=False),
        sa.Column('model_version', sa.String(length=50), nullable=False),
        sa.Column('latency_ms', sa.Integer(), nullable=False),
        sa.Column('input_payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('output_payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_ai_inference_log_issue_id', 'ai_inference_log', ['issue_id'])


def downgrade() -> None:
    op.drop_table('ai_inference_log')
    op.drop_table('sla_policies')
    op.drop_table('places')
