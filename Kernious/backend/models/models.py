"""
SQLAlchemy ORM Models for Kernious Database Layer
Defines Users, Platforms, Contests, Problems, Submissions, Mistakes, Reports, and Notes schemas.
"""
import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True) # e.g. 'usr_dev123'
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    platforms = relationship("Platform", back_populates="user", cascade="all, delete-orphan")
    contests = relationship("Contest", back_populates="user", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="user", cascade="all, delete-orphan")
    mistakes = relationship("Mistake", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")

class Platform(Base):
    __tablename__ = "platforms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    platform = Column(String, nullable=False) # 'codeforces', 'leetcode', 'codechef'
    handle = Column(String, nullable=False)
    sync_status = Column(String, default="synced") # 'synced', 'error'
    last_synced_at = Column(DateTime, default=datetime.datetime.utcnow)
    current_rating = Column(Integer, default=0)
    peak_rating = Column(Integer, default=0)
    solved_count = Column(Integer, default=0)

    user = relationship("User", back_populates="platforms")

class Contest(Base):
    __tablename__ = "contests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    contest_id = Column(String, index=True, nullable=False) # e.g. 'cf_1920'
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    platform = Column(String, nullable=False)
    name = Column(String, nullable=False)
    date = Column(String, nullable=False)
    rank = Column(Integer, nullable=False)
    rating_before = Column(Integer, nullable=False)
    rating_after = Column(Integer, nullable=False)
    rating_change = Column(Integer, nullable=False)
    solved_count = Column(Integer, default=0)
    total_problems = Column(Integer, default=5)
    summary = Column(Text, nullable=True) # Cached AI Summary

    user = relationship("User", back_populates="contests")

class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, autoincrement=True)
    problem_id = Column(String, unique=True, index=True, nullable=False) # e.g. 'CF-1920A'
    contest_id = Column(String, nullable=True)
    name = Column(String, nullable=False)
    index = Column(String, nullable=False) # 'A', 'B', 'C'
    difficulty = Column(String, nullable=True) # '1400', 'Medium'
    tags = Column(String, nullable=True) # Comma-separated tags
    status = Column(String, default="attempted") # 'solved', 'attempted', 'unsolved'

    submissions = relationship("Submission", back_populates="problem", cascade="all, delete-orphan")
    mistakes = relationship("Mistake", back_populates="problem", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="problem", cascade="all, delete-orphan")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    submission_id = Column(String, unique=True, index=True, nullable=False)
    problem_id = Column(String, ForeignKey("problems.problem_id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    language = Column(String, nullable=True)
    runtime = Column(String, nullable=True)
    memory = Column(String, nullable=True)
    verdict = Column(String, nullable=False) # 'OK', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED'
    time_seconds = Column(Integer, nullable=True)
    participant_type = Column(String, default="CONTESTANT") # 'CONTESTANT', 'PRACTICE', 'VIRTUAL', 'OUT_OF_COMPETITION'
    source_code = Column(Text, nullable=True)

    user = relationship("User", back_populates="submissions")
    problem = relationship("Problem", back_populates="submissions")

class Mistake(Base):
    __tablename__ = "mistakes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    problem_id = Column(String, ForeignKey("problems.problem_id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    mistake_type = Column(String, nullable=False) # e.g., 'Off-by-one errors'
    reason = Column(Text, nullable=True)
    concept = Column(String, nullable=True)
    confidence = Column(Float, default=0.9)
    missed_concept = Column(Text, nullable=True)
    thinking_direction = Column(Text, nullable=True)
    direction_not_to_go = Column(Text, nullable=True)

    user = relationship("User", back_populates="mistakes")
    problem = relationship("Problem", back_populates="mistakes")

class Report(Base):
    __tablename__ = "reports"

    report_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    contest_range = Column(String, nullable=False) # e.g. 'Contests 1-5'
    milestone_tier = Column(Integer, nullable=False) # 5, 10, 20, 50
    summary = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reports")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    problem_id = Column(String, ForeignKey("problems.problem_id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    user_note = Column(Text, nullable=False)
    learning = Column(Text, nullable=True)
    shortcut = Column(Text, nullable=True)

    user = relationship("User", back_populates="notes")
    problem = relationship("Problem", back_populates="notes")
