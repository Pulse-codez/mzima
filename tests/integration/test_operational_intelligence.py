import asyncio
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from backend.core.config import settings
from backend.core.security import get_password_hash
from backend.mcp.server import ReadOnlyMzimaMCP
from backend.models.domain import AuditEvent, RoleEnum, User, Visit, VisitStatusEnum
from backend.models.flow import BottleneckAlert, OperationalRecommendation
from backend.mcp.server import create_mcp_server
from mcp.shared.memory import create_connected_server_and_client_session


@pytest.fixture(autouse=True)
def disable_live_agentrouter(monkeypatch):
    monkeypatch.setattr(settings, "AGENTROUTER_API_KEY", "")


def login(client: TestClient, username: str, password: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/login", data={"username": username, "password": password}
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def seed_operational_data(test_session_factory) -> None:
    now = datetime.utcnow()
    with test_session_factory() as db:
        db.add_all(
            [
                Visit(
                    token_number="T-OUT-001",
                    age_band="adult",
                    visit_type="new",
                    service_point="outpatient",
                    arrival_time=now - timedelta(minutes=45),
                    status=VisitStatusEnum.IN_QUEUE,
                    is_fast_track=False,
                    red_flags={},
                ),
                Visit(
                    token_number="T-OUT-002",
                    age_band="adult",
                    visit_type="review",
                    service_point="outpatient",
                    arrival_time=now - timedelta(minutes=30),
                    status=VisitStatusEnum.IN_QUEUE,
                    is_fast_track=False,
                    red_flags={},
                ),
                Visit(
                    token_number="T-PED-001",
                    age_band="under_5",
                    visit_type="new",
                    service_point="pediatrics",
                    arrival_time=now - timedelta(minutes=15),
                    status=VisitStatusEnum.IN_QUEUE,
                    is_fast_track=False,
                    red_flags={},
                ),
            ]
        )
        db.add(
            BottleneckAlert(
                alert_code="arrival_volume_exceeds_capacity",
                service_point="outpatient",
                severity="medium",
                metric_name="capacity_gap",
                metric_value=2.0,
                threshold_value=3.0,
                evidence={"queue_length": 2, "arrivals_last_hour": 4},
                status="pending",
            )
        )
        db.add(
            OperationalRecommendation(
                recommendation_type="review_queue_flow",
                service_point="outpatient",
                suggested_action="Supervisor should review outpatient queue flow.",
                rationale="Recorded queue and wait measurements indicate pressure.",
                evidence={"queue_length": 2},
                status="pending",
            )
        )
        db.commit()


def test_six_operational_questions_return_retrieved_facts_and_advisory_results(
    client, test_session_factory
):
    seed_operational_data(test_session_factory)
    headers = login(client, "test-clinician", "test-clinician-password")
    cases = [
        ("How many patients are currently waiting?", "queue_status"),
        ("Which clinic is experiencing the longest queue?", "longest_queue"),
        ("Where are the current capacity bottlenecks?", "bottlenecks"),
        ("Explain why the outpatient queue is growing.", "explain_queue_growth"),
        ("Which available slots could help reduce the backlog?", "available_slots"),
        (
            "What operational adjustments would you recommend to the supervisor?",
            "supervisor_recommendations",
        ),
    ]

    results = []
    for query, expected_intent in cases:
        response = client.post(
            "/api/v1/flow/operational-query", headers=headers, json={"query": query}
        )
        assert response.status_code == 200
        result = response.json()
        assert result["intent"] == expected_intent
        assert result["status"] == "ok"
        assert result["facts"]
        assert result["tools_invoked"]
        assert result["requires_human_review"] is True
        results.append(result)

    assert results[0]["facts"]["total_in_queue"] == 3
    assert results[1]["facts"]["longest_queue"]["service_point"] == "outpatient"
    assert results[1]["facts"]["longest_queue"]["utilisation"] is None
    assert results[1]["facts"]["longest_queue"]["capacity_gap"] is None
    assert results[2]["facts"]["bottlenecks"][0]["service_point"] == "outpatient"
    assert "capacity_gap" in results[3]["explanation"]
    assert results[4]["facts"]["available_slots"]
    recommendation = results[5]["recommendations"][0]
    assert recommendation["advisory"] is True
    assert recommendation["requires_human_review"] is True
    assert recommendation["status"] == "pending"

    with test_session_factory() as db:
        events = (
            db.query(AuditEvent)
            .filter(AuditEvent.action == "OPERATIONAL_QUERY")
            .order_by(AuditEvent.timestamp.asc())
            .all()
        )
    assert len(events) == 6
    assert all(event.actor_id is not None for event in events)
    assert all(event.payload["outcome"] == "ok" for event in events)
    assert all(event.payload["tools_invoked"] for event in events)
    assert all("query" not in event.payload for event in events)


def test_empty_database_returns_empty_status_without_fabricated_metrics(
    client, test_session_factory
):
    headers = login(client, "test-clinician", "test-clinician-password")
    queue = client.post(
        "/api/v1/flow/operational-query",
        headers=headers,
        json={"query": "How many patients are waiting?"},
    ).json()
    bottlenecks = client.post(
        "/api/v1/flow/operational-query",
        headers=headers,
        json={"query": "Where are the current capacity bottlenecks?"},
    ).json()

    assert queue["status"] == "empty"
    assert queue["facts"]["total_in_queue"] == 0
    assert bottlenecks["status"] == "empty"
    assert bottlenecks["facts"]["bottlenecks"] == []
    assert "does not establish that no bottleneck exists" in bottlenecks["explanation"]
    with test_session_factory() as db:
        assert db.query(AuditEvent).filter_by(action="OPERATIONAL_QUERY").count() == 2


def test_empty_invalid_and_unsupported_queries(client):
    headers = login(client, "test-clinician", "test-clinician-password")
    for query in ("", "   ", "x" * 501):
        response = client.post(
            "/api/v1/flow/operational-query", headers=headers, json={"query": query}
        )
        assert response.status_code == 422

    unsupported = client.post(
        "/api/v1/flow/operational-query",
        headers=headers,
        json={"query": "Write a poem about rain."},
    )
    assert unsupported.status_code == 200
    assert unsupported.json()["status"] == "unsupported"
    assert unsupported.json()["facts"] == {}
    assert unsupported.json()["tools_invoked"] == []


def test_endpoint_requires_authentication_and_supervisor_or_admin_role(
    client, test_session_factory
):
    path = "/api/v1/flow/operational-query"
    payload = {"query": "How many patients are waiting?"}
    assert client.post(path, json=payload).status_code == 401

    for username, password in (
        ("test-clerk", "test-clerk-password"),
        ("test-nurse", "test-nurse-password"),
    ):
        assert client.post(
            path, headers=login(client, username, password), json=payload
        ).status_code == 403

    with test_session_factory() as db:
        db.add(
            User(
                username="test-admin",
                hashed_password=get_password_hash("test-admin-password"),
                role=RoleEnum.ADMIN,
                is_active=True,
            )
        )
        db.commit()
    admin_response = client.post(
        path,
        headers=login(client, "test-admin", "test-admin-password"),
        json=payload,
    )
    assert admin_response.status_code == 200


def test_mcp_failure_returns_no_facts_and_is_audited(client, test_session_factory, monkeypatch):
    def fail(_session_factory=None):
        raise RuntimeError("synthetic MCP failure")

    monkeypatch.setattr(ReadOnlyMzimaMCP, "get_live_queue_summary", fail)
    headers = login(client, "test-clinician", "test-clinician-password")
    response = client.post(
        "/api/v1/flow/operational-query",
        headers=headers,
        json={"query": "How many patients are currently waiting?"},
    )

    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "error"
    assert result["facts"] == {}
    assert result["recommendations"] == []
    assert result["error_type"] == "RuntimeError"
    with test_session_factory() as db:
        event = db.query(AuditEvent).filter_by(action="OPERATIONAL_QUERY").one()
    assert event.payload["outcome"] == "error"
    assert event.payload["tools_invoked"] == ["get_live_queue_summary_tool"]


def test_database_failure_returns_no_facts_and_is_audited(
    client, test_session_factory, monkeypatch
):
    def fail(service_point=None, session_factory=None):
        raise OperationalError("SELECT flow_summary", {}, RuntimeError("synthetic database error"))

    monkeypatch.setattr(ReadOnlyMzimaMCP, "get_clinic_workload_summary", fail)
    headers = login(client, "test-clinician", "test-clinician-password")
    response = client.post(
        "/api/v1/flow/operational-query",
        headers=headers,
        json={"query": "Explain why the outpatient queue is growing."},
    )

    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "error"
    assert result["facts"] == {}
    assert result["recommendations"] == []
    with test_session_factory() as db:
        event = db.query(AuditEvent).filter_by(action="OPERATIONAL_QUERY").one()
    assert event.payload["outcome"] == "error"
    assert event.payload["error_type"]


def test_fastmcp_operational_tools_require_role_and_audit_success(
    client, test_session_factory
):
    async def invoke_without_actor():
        server = create_mcp_server(test_session_factory)
        async with create_connected_server_and_client_session(server) as session:
            await session.initialize()
            return await session.call_tool("get_live_queue_summary_tool", {})

    denied = asyncio.run(invoke_without_actor())
    assert denied.isError is True

    with test_session_factory() as db:
        clinician = db.query(User).filter_by(username="test-clinician").one()
        clinician_id = clinician.id

    async def invoke_as_clinician():
        server = create_mcp_server(test_session_factory, actor_id=clinician_id)
        async with create_connected_server_and_client_session(server) as session:
            await session.initialize()
            return await session.call_tool("get_live_queue_summary_tool", {})

    result = asyncio.run(invoke_as_clinician())
    assert result.isError is False
    with test_session_factory() as db:
        event = db.query(AuditEvent).filter_by(action="MCP_OPERATIONAL_QUERY").one()
    assert event.actor_id == clinician_id
    assert event.entity_id == "get_live_queue_summary_tool"
    assert event.payload["outcome"] == "empty"
