from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

SUPABASE_URL = "postgresql://postgres:Dhana%40Rayer@db.aqeidutucbxhbfkuihuu.supabase.co:5432/postgres"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", SUPABASE_URL)

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, pool_pre_ping=True, pool_size=10, max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
