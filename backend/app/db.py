from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Normalize DATABASE_URL:
#  - Render gives postgres://  → convert to postgresql://  (psycopg2)
#  - Local may use postgresql+psycopg:// (psycopg3) → convert to postgresql://
def _fix_db_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("postgresql+psycopg://"):
        url = url.replace("postgresql+psycopg://", "postgresql://", 1)
    return url

# Create engine
engine = create_engine(_fix_db_url(settings.DATABASE_URL))

# Session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base
Base = declarative_base()

# DB session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Connection check helper
def check_db_connection():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return True
    except Exception as e:
        print("Database connection error:", e)
        return False
