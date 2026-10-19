"""create chronic_spots and kpi_snapshots tables

Revision ID: 005_phase7_analytics
Revises: 004_phase6_escalations
Create Date: 2026-10-18 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from geoalchemy2 import Geography

# revision identifiers, used by Alembic.
revision: str = '005_phase7_analytics'
down_revision: Union[str, None] = '004_phase6_escalations'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Chronic spots table (Superpower 8: >=5 in 50m / 30 days)
    op.create_table(
        'chronic_spots',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('ward_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('wards.id', ondelete='SET NULL'), nullable=True),
        sa.Column('center_location', Geography(geometry_type='POINT', srid=4326, spatial_index=True), nullable=False),
        sa.Column('incident_count', sa.Integer(), nullable=False),
        sa.Column('first_incident_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_incident_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('root_cause_notes', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_chronic_spots_category', 'chronic_spots', ['category'])

    # Monthly KPI snapshots table
    op.create_table(
        'kpi_snapshots',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('period', sa.String(length=7), nullable=False),
        sa.Column('composite_kpi', sa.Float(), nullable=False),
        sa.Column('sla_percentage', sa.Float(), nullable=False),
        sa.Column('avg_csat', sa.Float(), nullable=False),
        sa.Column('mttr_hours', sa.Float(), nullable=False),
        sa.Column('reopen_rate_percent', sa.Float(), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_kpi_snapshots_user_id', 'kpi_snapshots', ['user_id'])
    op.create_index('ix_kpi_snapshots_period', 'kpi_snapshots', ['period'])


def downgrade() -> None:
    op.drop_table('kpi_snapshots')
    op.drop_table('chronic_spots')
