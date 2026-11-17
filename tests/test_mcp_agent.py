import json
import uuid
import asyncio
from datetime import datetime, timedelta

import pytest

from backend.mcp import server as mcp_server
from backend.models.domain import AppointmentRequest, AppointmentSlot, RoleEnum, User, Visit
from backend.services.appointments.tools import get_appointment_slots, score_and_propose_route
from backend.services.appointments.workflow import (
    ApprovalError,
    issue_approval_token,
    review_and_commit,
)


@pytest.fixture
def mcp_database(test_session_factory):
    with test_session_factory() as db:
        clinician = User(
            username="mcp-clinician",
            hashed_password="not-used-in-this-fixture",
            role=RoleEnum.SHIFT_LEAD,
            is_active=True,
        )
        nurse = User(
            username="mcp-nurse",
            hashed_password="not-used-in-this-fixture",
            role=RoleEnum.NURSE,
            is_active=True,
        )
        slot = AppointmentSlot(
            specialty="General outpatient",
            starts_at=datetime.utcnow() + timedelta(days=1),
            capacity=1,
            booked_count=0,
        )
        visit = Visit(
            token_number="T-TEST-001",
            age_band="adult",
            visit_type="new",
            is_fast_track=False,
            red_flags={},
        )
        db.add_all([clinician, nurse, slot, visit])
        db.flush()
        request = AppointmentRequest(
            patient_identifier="SYNTHETIC-AGENT-01",
            requested_specialty="General outpatient",
            status="PENDING_REVIEW",
            proposed_slot_id=slot.id,
            agent_proposal={"tool": "score_and_propose_route", "status": "PENDING_CLINICIAN_REVIEW"},
        )
        db.add(request)
        db.commit()
        request_id = str(request.id)
        clinician_id = clinician.id
        nurse_id = nurse.id
        slot_id = slot.id
    return test_session_factory, request_id, clinician_id, nurse_id, slot_id


def test_backend_read_only_mcp_queries_service_data(mcp_database, monkeypatch) -> None:
    testing_session, request_id, _, _, _ = mcp_database
    monkeypatch.setattr(mcp_server, "SessionLocal", testing_session)

    summary = json.loads(mcp_server.ReadOnlyMzimaMCP.get_live_queue_summary())
    reviews = json.loads(mcp_server.ReadOnlyMzimaMCP.get_pending_appointment_reviews())

    assert summary["total_in_queue"] == 1
    assert summary["top_tokens"][0]["token_number"] == "T-TEST-001"
    assert [item["id"] for item in reviews] == [request_id]


def test_backend_operational_mcp_adapters_use_existing_data(mcp_database) -> None:
    testing_session, _, _, _, _ = mcp_database
    workload = json.loads(
        mcp_server.ReadOnlyMzimaMCP.get_clinic_workload_summary(
            session_factory=testing_session
        )
    )
    alerts = json.loads(
        mcp_server.ReadOnlyMzimaMCP.get_bottleneck_alerts(
            session_factory=testing_session
        )
    )
    recommendations = json.loads(
        mcp_server.ReadOnlyMzimaMCP.get_supervisor_recommendations(
            session_factory=testing_session
        )
    )

    assert workload["queue_length"] == 1
    assert workload["arrivals_last_hour"] == 1
    assert alerts == []
    assert recommendations == []


def test_fastmcp_registers_operational_and_appointment_tools(test_session_factory) -> None:
    pytest.importorskip("mcp")
    from mcp.shared.memory import create_connected_server_and_client_session

    async def list_names() -> set[str]:
        server = mcp_server.create_mcp_server(test_session_factory)
        async with create_connected_server_and_client_session(server) as session:
            await session.initialize()
            result = await session.list_tools()
            return {tool.name for tool in result.tools}

    assert asyncio.run(list_names()) == {
        "get_live_queue_summary_tool",
        "get_pending_appointment_reviews_tool",
        "get_clinic_workload_summary_tool",
        "get_clinic_workload_summaries_tool",
        "get_bottleneck_alerts_tool",
        "get_supervisor_recommendations_tool",
        "get_appointment_slots_tool",
        "get_available_appointment_slots_tool",
        "score_and_propose_route_tool",
        "review_and_commit_tool",
    }


def test_backend_appointment_tools_propose_and_commit_with_clinician_token(mcp_database) -> None:
    testing_session, request_id, clinician_id, _, slot_id = mcp_database
    with testing_session() as db:
        slots = get_appointment_slots(db, "General outpatient")
        assert [slot.id for slot in slots] == [slot_id]
        proposal = score_and_propose_route(db, "General outpatient")
        assert proposal["status"] == "PENDING_CLINICIAN_REVIEW"
        assert proposal["slot_id"] == str(slot_id)

    approval_token = issue_approval_token(
        request_id=uuid.UUID(request_id),
        clinician_id=clinician_id,
        decision="APPROVE",
        reason="Synthetic backend workflow test",
    )
    with testing_session() as db:
        result = review_and_commit(db, approval_token)
        assert result["status"] == "BOOKED"
    with testing_session() as db:
        saved_request = db.get(AppointmentRequest, uuid.UUID(request_id))
        assert saved_request.status == "BOOKED"
        slot = db.get(AppointmentSlot, saved_request.booked_slot_id)
        assert slot.booked_count == 1
        assert len(saved_request.decisions) == 1


def test_approval_token_rejects_unauthorized_role_and_replay(mcp_database) -> None:
    testing_session, request_id, clinician_id, nurse_id, _ = mcp_database
    unauthorized = issue_approval_token(
        uuid.UUID(request_id), nurse_id, "APPROVE", "Not a supervisor"
    )
    with testing_session() as db, pytest.raises(ApprovalError, match="active clinician"):
        review_and_commit(db, unauthorized)

    expired_or_invalid = "not-a-signed-token"
    with testing_session() as db, pytest.raises(ApprovalError, match="Invalid or expired"):
        review_and_commit(db, expired_or_invalid)

    approval_token = issue_approval_token(
        uuid.UUID(request_id), clinician_id, "APPROVE", "Synthetic clinician approval"
    )
    with testing_session() as db:
        assert review_and_commit(db, approval_token)["status"] == "BOOKED"
    with testing_session() as db, pytest.raises(ApprovalError, match="already been decided"):
        review_and_commit(db, approval_token)
