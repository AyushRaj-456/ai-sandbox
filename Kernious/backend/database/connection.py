"""
Kernious Database Engine & Session Factory
Uses SQLite for zero-config local development, supporting DATABASE_URL env var for PostgreSQL / Neon.
Auto-loads configuration from backend/.env
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load .env variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kernious.db")

# Convert postgres:// to postgresql:// if needed for SQLAlchemy 2.0
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

try:
    if DATABASE_URL.startswith("sqlite"):
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            pass
except Exception as e:
    print(f"[Kernious DB] PostgreSQL engine unavailable ({e}). Falling back to SQLite database.")
    DATABASE_URL = "sqlite:///./kernious.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency for FastAPI endpoints to obtain DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
