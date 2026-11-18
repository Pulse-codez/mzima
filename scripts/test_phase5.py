from datetime import datetime
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.adapters.clinic.mock_fhir import MockClinicFHIRAdapter
from backend.db.session import Base
from backend.mcp import server as mcp_server
from backend.models.domain import AppointmentRequest, Visit
import backend.models


def run_tests():
    database_url = os.environ.get("TEST_DATABASE_URL")
    if not database_url:
        raise RuntimeError("TEST_DATABASE_URL must point to an isolated PostgreSQL database")
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
    )
    Base.metadata.create_all(bind=engine)
    testing_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    previous_session_factory = mcp_server.SessionLocal
    mcp_server.SessionLocal = testing_session
    try:
        with testing_session() as db:
            dummy_req = AppointmentRequest(
                patient_identifier="SYNTHETIC-PHASE5",
                requested_specialty="Pediatrics",
                status="APPROVED",
            )
            db.add_all(
                [
                    dummy_req,
                    Visit(
                        token_number="T-PHASE5-001",
                        age_band="adult",
                        visit_type="new",
                        is_fast_track=False,
                        red_flags={},
                    ),
                ]
            )
            db.flush()
            db.commit()
            print("=== Testing Mock FHIR Adapter ===")
            print(MockClinicFHIRAdapter.export_to_fhir_appointment(dummy_req))

        print("\n=== Testing Backend Read-Only Queue Tools ===")
        print("Queue Summary:")
        print(mcp_server.ReadOnlyMzimaMCP.get_live_queue_summary())
        print("\nPending Reviews:")
        print(mcp_server.ReadOnlyMzimaMCP.get_pending_appointment_reviews())
    finally:
        mcp_server.SessionLocal = previous_session_factory
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


if __name__ == "__main__":
    run_tests()
