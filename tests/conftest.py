from collections.abc import Generator
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.api.deps import get_db
from backend.core.security import get_password_hash
from backend.db.session import Base
from backend.main import app
from backend.models.domain import AppointmentSlot, RoleEnum, User
import backend.models


@pytest.fixture
def test_session_factory():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    try:
        yield session_factory
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def client(test_session_factory) -> Generator[TestClient, None, None]:
    with test_session_factory() as db:
        db.add_all(
            [
                User(
                    username="test-clerk",
                    hashed_password=get_password_hash("test-clerk-password"),
                    role=RoleEnum.CLERK,
                ),
                User(
                    username="test-nurse",
                    hashed_password=get_password_hash("test-nurse-password"),
                    role=RoleEnum.NURSE,
                ),
                User(
                    username="test-clinician",
                    hashed_password=get_password_hash("test-clinician-password"),
                    role=RoleEnum.SHIFT_LEAD,
                ),
            ]
        )
        db.add(
            AppointmentSlot(
                specialty="General outpatient",
                starts_at=datetime.utcnow() + timedelta(days=1),
                capacity=1,
                booked_count=0,
            )
        )
        db.commit()

    def override_get_db():
        with test_session_factory() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_db, None)