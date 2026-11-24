import uuid
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker

import backend.models  # noqa: F401
from backend.api.deps import get_db
from backend.core.security import create_access_token, get_password_hash
from backend.db.session import Base
from backend.main import app
from backend.models.domain import (
    AppointmentRequest,
    AppointmentSlot,
    AuditEvent,
    ClinicianDecision,
    RoleEnum,
    User,
)
from backend.services.appointments.workflow import (
    ApprovalError,
    issue_approval_token,
    review_and_commit,
)


@pytest.fixture()
def phase3_env():
    database_url = os.environ.get("TEST_DATABASE_URL")
    if not database_url:
        pytest.fail("TEST_DATABASE_URL must point to an isolated PostgreSQL database")
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
    )
    Base.metadata.create_all(engine)
    SessionFactory = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    db = SessionFactory()
    clerk = User(
        username="p3-clerk",
        hashed_password=get_password_hash("secret123"),
        role=RoleEnum.CLERK,
        is_active=True,
    )
    nurse = User(
        username="p3-nurse",
        hashed_password=get_password_hash("secret123"),
        role=RoleEnum.NURSE,
        is_active=True,
    )
    clinician_a = User(
        username="p3-lead-a",
        hashed_password=get_password_hash("secret123"),
        role=RoleEnum.SHIFT_LEAD,
        is_active=True,
    )
    clinician_b = User(
        username="p3-lead-b",
        hashed_password=get_password_hash("secret123"),
        role=RoleEnum.SHIFT_LEAD,
        is_active=True,
    )
    db.add_all([clerk, nurse, clinician_a, clinician_b])
    db.commit()
    for user in (clerk, nurse, clinician_a, clinician_b):
        db.refresh(user)

    tokens = {
        "clerk": create_access_token({"sub": clerk.username, "role": clerk.role.value}),
        "nurse": create_access_token({"sub": nurse.username, "role": nurse.role.value}),
        "lead_a": create_access_token({"sub": clinician_a.username, "role": clinician_a.role.value}),
        "lead_b": create_access_token({"sub": clinician_b.username, "role": clinician_b.role.value}),
    }
    users = {
        "clerk": clerk,
        "nurse": nurse,
        "lead_a": clinician_a,
        "lead_b": clinician_b,
    }
    db.close()

    def override_get_db():
        with SessionFactory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as client:
            yield {
                "client": client,
                "session_factory": SessionFactory,
                "tokens": tokens,
                "users": users,
            }
    finally:
        app.dependency_overrides.pop(get_db, None)
        Base.metadata.drop_all(engine)
        engine.dispose()


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_scenario_a_end_to_end_approval_and_audit(phase3_env):
    client = phase3_env["client"]
    SessionFactory = phase3_env["session_factory"]
    lead_token = phase3_env["tokens"]["lead_a"]
    clerk_token = phase3_env["tokens"]["clerk"]

    now = datetime.utcnow()
    with SessionFactory() as db:
        slot = AppointmentSlot(
            specialty="General Outpatient",
            starts_at=now + timedelta(hours=6),
            capacity=2,
            booked_count=0,
        )
        db.add(slot)
        db.commit()
        slot_id = str(slot.id)

    slots_res = client.get(
        "/api/v1/appointments/slots",
        params={"specialty": "General Outpatient"},
    )
    assert slots_res.status_code == 200
    assert len(slots_res.json()) == 1
    assert slots_res.json()[0]["booked_count"] == 0

    req_res = client.post(
        "/api/v1/appointments/appointment-requests",
        json={
            "patient_identifier": "SYN-PAT-001",
            "age_band": "adult",
            "visit_type": "new",
            "requested_specialty": "General Outpatient",
        },
    )
    assert req_res.status_code == 201
    created = req_res.json()
    request_id = created["id"]
    assert created["status"] == "PENDING_REVIEW"
    assert created["proposed_slot_id"] == slot_id
    assert created["booked_slot_id"] is None
    assert created["agent_proposal"]["expires_at"] is not None

    with SessionFactory() as db:
        assert db.get(AppointmentSlot, uuid.UUID(slot_id)).booked_count == 0

    queue_res = client.get(
        "/api/v1/appointments/clinic/review-queue",
        headers=_auth(lead_token),
    )
    assert queue_res.status_code == 200
    assert any(item["id"] == request_id for item in queue_res.json())

    decision_res = client.post(
        f"/api/v1/appointments/appointment-requests/{request_id}/decision",
        headers=_auth(lead_token),
        json={"decision": "APPROVE", "reason": "Slot capacity verified for outpatient review."},
    )
    assert decision_res.status_code == 200
    assert decision_res.json()["decision"] == "APPROVE"

    detail_res = client.get(
        f"/api/v1/appointments/appointments/{request_id}",
        headers=_auth(clerk_token),
    )
    assert detail_res.status_code == 200
    assert detail_res.json()["status"] == "BOOKED"
    assert detail_res.json()["booked_slot_id"] == slot_id

    with SessionFactory() as db:
        assert db.get(AppointmentSlot, uuid.UUID(slot_id)).booked_count == 1
        audit_actions = [
            row.action
            for row in db.query(AuditEvent)
            .filter(AuditEvent.entity_id == request_id)
            .all()
        ]
        assert "SUBMIT_APPOINTMENT_REQUEST" in audit_actions
        assert "CLINICIAN_DECISION" in audit_actions


def test_scenario_b_clinician_rejection_preserves_slot_capacity(phase3_env):
    client = phase3_env["client"]
    SessionFactory = phase3_env["session_factory"]
    lead_token = phase3_env["tokens"]["lead_a"]

    with SessionFactory() as db:
        slot = AppointmentSlot(
            specialty="Pediatrics",
            starts_at=datetime.utcnow() + timedelta(days=1),
            capacity=1,
            booked_count=0,
        )
        db.add(slot)
        db.commit()
        slot_id = slot.id

    req_res = client.post(
        "/api/v1/appointments/appointment-requests",
        json={
            "patient_identifier": "SYN-PAT-002",
            "age_band": "under_5",
            "visit_type": "review",
            "requested_specialty": "Pediatrics",
        },
    )
    request_id = req_res.json()["id"]

    reject_res = client.post(
        f"/api/v1/appointments/appointment-requests/{request_id}/decision",
        headers=_auth(lead_token),
        json={"decision": "REJECT", "reason": "Requires in-person triage redirection first."},
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["decision"] == "REJECT"

    with SessionFactory() as db:
        saved_req = db.get(AppointmentRequest, uuid.UUID(request_id))
        assert saved_req.status == "REJECTED"
        assert saved_req.booked_slot_id is None
        assert db.get(AppointmentSlot, slot_id).booked_count == 0


def test_scenario_c_no_available_capacity_returns_no_match_without_booking(phase3_env):
    client = phase3_env["client"]
    SessionFactory = phase3_env["session_factory"]
    lead_token = phase3_env["tokens"]["lead_a"]

    with SessionFactory() as db:
        full_slot = AppointmentSlot(
            specialty="Cardiology",
            starts_at=datetime.utcnow() + timedelta(days=1),
            capacity=1,
            booked_count=1,
        )
        db.add(full_slot)
        db.commit()

    slots_res = client.get("/api/v1/appointments/slots", params={"specialty": "Cardiology"})
    assert slots_res.status_code == 200
    assert slots_res.json() == []

    req_res = client.post(
        "/api/v1/appointments/appointment-requests",
        json={
            "patient_identifier": "SYN-PAT-003",
            "age_band": "over_65",
            "visit_type": "new",
            "requested_specialty": "Cardiology",
        },
    )
    assert req_res.status_code == 201
    payload = req_res.json()
    assert payload["proposed_slot_id"] is None
    assert payload["booked_slot_id"] is None
    assert payload["agent_proposal"]["status"] == "NO_MATCH"

    approve_res = client.post(
        f"/api/v1/appointments/appointment-requests/{payload['id']}/decision",
        headers=_auth(lead_token),
        json={"decision": "APPROVE", "reason": "Attempt approval without slot"},
    )
    assert approve_res.status_code == 409


def test_scenario_d_concurrent_clinician_decisions_prevent_duplicate_booking(phase3_env):
    client = phase3_env["client"]
    SessionFactory = phase3_env["session_factory"]
    lead_a = phase3_env["users"]["lead_a"]
    lead_b = phase3_env["users"]["lead_b"]

    with SessionFactory() as db:
        slot = AppointmentSlot(
            specialty="Antenatal",
            starts_at=datetime.utcnow() + timedelta(days=1),
            capacity=2,
            booked_count=0,
        )
        db.add(slot)
        db.commit()
        slot_id = slot.id

    req_res = client.post(
        "/api/v1/appointments/appointment-requests",
        json={
            "patient_identifier": "SYN-PAT-004",
            "age_band": "adult",
            "visit_type": "review",
            "requested_specialty": "Antenatal",
        },
    )
    request_id = uuid.UUID(req_res.json()["id"])

    token_a = issue_approval_token(request_id, lead_a.id, "APPROVE", "Approved by Clinician A")
    token_b = issue_approval_token(request_id, lead_b.id, "APPROVE", "Approved by Clinician B")

    def attempt_commit(token: str) -> str:
        with SessionFactory() as worker_db:
            try:
                review_and_commit(worker_db, token)
                return "COMMITTED"
            except (ApprovalError, OperationalError):
                worker_db.rollback()
                return "REJECTED_CONFLICT"

    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(attempt_commit, [token_a, token_b]))

    assert outcomes.count("COMMITTED") == 1
    assert outcomes.count("REJECTED_CONFLICT") == 1

    with SessionFactory() as db:
        assert db.get(AppointmentSlot, slot_id).booked_count == 1
        assert db.query(ClinicianDecision).filter_by(request_id=request_id).count() == 1


def test_expired_proposal_date_filters_capacity_race_and_rbac(phase3_env):
    client = phase3_env["client"]
    SessionFactory = phase3_env["session_factory"]
    clerk_token = phase3_env["tokens"]["clerk"]
    nurse_token = phase3_env["tokens"]["nurse"]
    lead_token = phase3_env["tokens"]["lead_a"]

    now = datetime.utcnow()
    with SessionFactory() as db:
        s1 = AppointmentSlot(
            specialty="Dental",
            starts_at=now + timedelta(days=1),
            capacity=1,
            booked_count=0,
        )
        s2 = AppointmentSlot(
            specialty="Dental",
            starts_at=now + timedelta(days=5),
            capacity=1,
            booked_count=0,
        )
        db.add_all([s1, s2])
        db.commit()

    # Date range filtering and invalid range check
    filtered = client.get(
        "/api/v1/appointments/slots",
        params={
            "specialty": "Dental",
            "to_date": (now + timedelta(days=2)).isoformat(),
        },
    )
    assert filtered.status_code == 200
    assert len(filtered.json()) == 1

    bad_range = client.get(
        "/api/v1/appointments/slots",
        params={
            "specialty": "Dental",
            "from_date": (now + timedelta(days=4)).isoformat(),
            "to_date": (now + timedelta(days=2)).isoformat(),
        },
    )
    assert bad_range.status_code == 400

    # Submit request and verify RBAC gates
    first = client.post(
        "/api/v1/appointments/appointment-requests",
        json={
            "patient_identifier": "SYN-PAT-005",
            "age_band": "adult",
            "visit_type": "new",
            "requested_specialty": "Dental",
        },
    )
    assert first.status_code == 201
    request_id = first.json()["id"]

    assert client.get("/api/v1/appointments/clinic/review-queue").status_code == 401
    assert (
        client.get("/api/v1/appointments/clinic/review-queue", headers=_auth(clerk_token)).status_code
        == 403
    )
    assert (
        client.post(
            f"/api/v1/appointments/appointment-requests/{request_id}/decision",
            headers=_auth(nurse_token),
            json={"decision": "APPROVE", "reason": "Unauthorized nurse approval"},
        ).status_code
        == 403
    )

    # Expired proposal transitions to EXPIRED and cannot be approved
    with SessionFactory() as db:
        req = db.get(AppointmentRequest, uuid.UUID(request_id))
        proposal = dict(req.agent_proposal)
        proposal["expires_at"] = (datetime.utcnow() - timedelta(minutes=5)).isoformat()
        req.agent_proposal = proposal
        db.commit()

    expired_res = client.post(
        f"/api/v1/appointments/appointment-requests/{request_id}/decision",
        headers=_auth(lead_token),
        json={"decision": "APPROVE", "reason": "Approving stale proposal"},
    )
    assert expired_res.status_code == 409
    assert "expired" in expired_res.json()["detail"].lower()

    with SessionFactory() as db:
        assert db.get(AppointmentRequest, uuid.UUID(request_id)).status == "EXPIRED"
