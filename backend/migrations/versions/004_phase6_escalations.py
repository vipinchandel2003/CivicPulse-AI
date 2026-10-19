"""create escalation and kpi tables

Revision ID: 004_phase6_escalations
Revises: 003_phase3_triage_places
Create Date: 2026-10-18 13:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '004_phase6_escalations'
down_revision: Union[str, None] = '003_phase3_triage_places'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Escalations table
    op.create_table(
        'escalations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('issue_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('civic_issues.id', ondelete='CASCADE'), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('notified_parties', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.create_index('ix_escalations_issue_id', 'escalations', ['issue_id'])
    op.create_index('ix_escalations_at', 'escalations', ['at'])

    # KPI Events table (immutable ledger for inspector performance)
    op.create_table(
        'kpi_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('issue_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('civic_issues.id', ondelete='SET NULL'), nullable=True),
        sa.Column('delta_score', sa.Float(), nullable=False),
        sa.Column('reason', sa.String(length=200), nullable=False),
        sa.Column('at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_kpi_events_user_id', 'kpi_events', ['user_id'])

    # Show cause recommendations table
    op.create_table(
        'show_cause_recommendations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('issue_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('civic_issues.id', ondelete='CASCADE'), nullable=False),
        sa.Column('draft_letter', sa.String(length=2000), nullable=False),
        sa.Column('is_reviewed_by_hod', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('hod_action', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_show_cause_recommendations_user_id', 'show_cause_recommendations', ['user_id'])


def downgrade() -> None:
    op.drop_table('show_cause_recommendations')
    op.drop_table('kpi_events')
    op.drop_table('escalations')
