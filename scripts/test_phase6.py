import uuid
from datetime import datetime, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.core.security import get_password_hash
from backend.db.session import Base
from backend.models.domain import AppointmentRequest, AppointmentSlot, RoleEnum, User
from backend.services.appointments.tools import score_and_propose_route
from backend.services.appointments.workflow import issue_approval_token, review_and_commit
import backend.models


def test_agent_safety_guardrails():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    testing_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    try:
        with testing_session() as db:
            clinician = User(
                username="synthetic-clinician",
                hashed_password=get_password_hash("synthetic-only-password"),
                role=RoleEnum.SHIFT_LEAD,
                is_active=True,
            )
            slot = AppointmentSlot(
                specialty="Orthopedics",
                starts_at=datetime.utcnow() + timedelta(days=1),
                capacity=1,
                booked_count=0,
            )
            request = AppointmentRequest(
                patient_identifier="SYNTHETIC-PHASE6",
                requested_specialty="Orthopedics",
                status="PENDING_REVIEW",
            )
            db.add_all([clinician, slot, request])
            db.flush()
            proposal = score_and_propose_route(db, request.requested_specialty)
            request.proposed_slot_id = uuid.UUID(proposal["slot_id"])
            request.agent_proposal = proposal
            db.commit()
            request_id = request.id
            clinician_id = clinician.id
            assert request.status == "PENDING_REVIEW"

        approval_token = issue_approval_token(
            request_id=request_id,
            clinician_id=clinician_id,
            decision="APPROVE",
            reason="Synthetic clinician review",
        )
        with testing_session() as db:
            result = review_and_commit(db, approval_token)
            assert result["status"] == "BOOKED"
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


if __name__ == "__main__":
    test_agent_safety_guardrails()