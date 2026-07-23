"""Initial schema for 8 core tables

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-07-18

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_email', 'users', ['email'])

    op.create_table(
        'platforms',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False, primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('platform', sa.String(), nullable=False),
        sa.Column('handle', sa.String(), nullable=False),
        sa.Column('sync_status', sa.String(), default='not_connected'),
        sa.Column('last_synced_at', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'contests',
        sa.Column('contest_id', sa.String(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('platform', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('date', sa.String(), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('rating_before', sa.Integer(), nullable=False),
        sa.Column('rating_after', sa.Integer(), nullable=False),
        sa.Column('rating_change', sa.Integer(), nullable=False),
        sa.Column('solved_count', sa.Integer(), default=0),
        sa.Column('total_problems', sa.Integer(), default=0),
        sa.Column('summary', sa.Text(), nullable=True),
    )
    op.create_index('ix_contests_contest_id', 'contests', ['contest_id'])

    op.create_table(
        'problems',
        sa.Column('problem_id', sa.String(), nullable=False, primary_key=True),
        sa.Column('contest_id', sa.String(), sa.ForeignKey('contests.contest_id'), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('index', sa.String(), nullable=True),
        sa.Column('difficulty', sa.String(), nullable=True),
        sa.Column('tags', sa.String(), nullable=True),
        sa.Column('status', sa.String(), default='unsolved'),
    )
    op.create_index('ix_problems_problem_id', 'problems', ['problem_id'])

    op.create_table(
        'submissions',
        sa.Column('submission_id', sa.String(), nullable=False, primary_key=True),
        sa.Column('problem_id', sa.String(), sa.ForeignKey('problems.problem_id'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('language', sa.String(), nullable=True),
        sa.Column('runtime', sa.String(), nullable=True),
        sa.Column('memory', sa.String(), nullable=True),
        sa.Column('verdict', sa.String(), nullable=False),
        sa.Column('time_seconds', sa.Integer(), nullable=True),
    )
    op.create_index('ix_submissions_submission_id', 'submissions', ['submission_id'])

    op.create_table(
        'mistakes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False, primary_key=True),
        sa.Column('problem_id', sa.String(), sa.ForeignKey('problems.problem_id'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('mistake_type', sa.String(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('concept', sa.String(), nullable=True),
        sa.Column('confidence', sa.Float(), default=0.9),
    )

    op.create_table(
        'reports',
        sa.Column('report_id', sa.String(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('contest_range', sa.String(), nullable=False),
        sa.Column('milestone_tier', sa.Integer(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('recommendations', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_reports_report_id', 'reports', ['report_id'])

    op.create_table(
        'notes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False, primary_key=True),
        sa.Column('problem_id', sa.String(), sa.ForeignKey('problems.problem_id'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('user_note', sa.Text(), nullable=False),
        sa.Column('learning', sa.Text(), nullable=True),
        sa.Column('shortcut', sa.Text(), nullable=True),
    )

def downgrade():
    op.drop_table('notes')
    op.drop_table('reports')
    op.drop_table('mistakes')
    op.drop_table('submissions')
    op.drop_table('problems')
    op.drop_table('contests')
    op.drop_table('platforms')
    op.drop_table('users')
