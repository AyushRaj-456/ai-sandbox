"""
Database Schema Definition for Kernious (SQLAlchemy)
8 Core Tables: Users, Platforms, Contests, Problems, Submissions, Mistakes, Reports, Notes
"""

# Table schema data types description:
# Users: id, name, email, created_at
# Platforms: id, user_id, platform, handle
# Contests: contest_id, platform, date, rank, rating_before, rating_after, rating_change
# Problems: problem_id, contest_id, difficulty, tags, status
# Submissions: submission_id, problem_id, language, runtime, memory, verdict
# Mistakes: problem_id, mistake_type, reason, concept, confidence
# Reports: report_id, user_id, contest_range, summary, recommendations, created_at
# Notes: problem_id, user_note, learning, shortcut

DATABASE_TABLES = [
    "users",
    "platforms",
    "contests",
    "problems",
    "submissions",
    "mistakes",
    "reports",
    "notes"
]
