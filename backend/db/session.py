from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from backend.core.config import settings

database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

if not database_url.startswith(("postgresql://", "postgresql+")):
    raise ValueError("DATABASE_URL must be a PostgreSQL connection string")

engine_kwargs = {
    "pool_pre_ping": True,
    "connect_args": {"connect_timeout": 5},
}

engine_kwargs.update(
    {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_recycle": 1800,  # Recycle stale cloud connections every 30 mins
    }
)

engine = create_engine(database_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
