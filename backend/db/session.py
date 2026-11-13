from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.core.config import settings

# Use psycopg2 dialect explicitly to avoid psycopg v3 issues
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)

<<<<<<< HEAD:app/db/session.py
connect_args = (
    {"check_same_thread": False}
    if settings.DATABASE_URL.startswith("sqlite")
    else {}
)
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
=======
engine = create_engine(
    database_url,
    pool_pre_ping=True,
)

>>>>>>> upstream/main:backend/db/session.py
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()