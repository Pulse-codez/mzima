import json

import pytest

from backend.agent import operational_router
from backend.agent.schemas import OperationalIntent
from backend.core.config import settings
from backend.mcp.server import ReadOnlyMzimaMCP
from backend.models.domain import RoleEnum, User


@pytest.fixture(autouse=True)
def disable_live_agentrouter(monkeypatch):
    monkeypatch.setattr(settings, "AGENTROUTER_API_KEY", "")


@pytest.fixture
def supervisor_id(test_session_factory):
    with test_session_factory() as db:
        supervisor = User(
            username="operational-supervisor",
            hashed_password="unused-test-hash",
            role=RoleEnum.SHIFT_LEAD,
            is_active=True,
        )
        db.add(supervisor)
        db.commit()
        return supervisor.id


@pytest.mark.parametrize(
    ("query", "intent"),
    [
        ("How many patients are currently waiting?", OperationalIntent.QUEUE_STATUS),
        ("Which clinic is experiencing the longest queue?", OperationalIntent.LONGEST_QUEUE),
        ("Where are the current capacity bottlenecks?", OperationalIntent.BOTTLENECKS),
        ("Explain why the outpatient queue is growing.", OperationalIntent.EXPLAIN_QUEUE_GROWTH),
        ("Which available slots could help reduce the backlog?", OperationalIntent.AVAILABLE_SLOTS),
        ("What operational adjustments would you recommend to the supervisor?", OperationalIntent.SUPERVISOR_RECOMMENDATIONS),
        ("Write a poem about rain", OperationalIntent.UNSUPPORTED),
    ],
)
def test_deterministic_intent_classification(query, intent):
    assert operational_router.classify_operational_query(query) == (intent, "rules")


def test_agentrouter_classifies_only_allowed_intent(monkeypatch):
    monkeypatch.setattr(settings, "AGENTROUTER_API_KEY", "mock-only-key")

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        def read(self):
            return json.dumps(
                {"choices": [{"message": {"content": '{"intent":"bottlenecks"}'}}]}
            ).encode()

    captured = []

    def fake_urlopen(request, timeout):
        captured.append((request, timeout))
        return Response()

    monkeypatch.setattr(operational_router.urllib.request, "urlopen", fake_urlopen)

    result = operational_router.classify_operational_query("Capacity pressure now?")

    assert result == (OperationalIntent.BOTTLENECKS, "agentrouter")
    assert captured[0][0].full_url == "https://agentrouter.org/v1/chat/completions"
    assert captured[0][1] == settings.AGENTROUTER_TIMEOUT_SECONDS


def test_invalid_agentrouter_intent_falls_back_to_rules(monkeypatch):
    monkeypatch.setattr(settings, "AGENTROUTER_API_KEY", "mock-only-key")

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        def read(self):
            return json.dumps(
                {"choices": [{"message": {"content": '{"intent":"commit_booking"}'}}]}
            ).encode()

    monkeypatch.setattr(
        operational_router.urllib.request,
        "urlopen",
        lambda *_args, **_kwargs: Response(),
    )

    assert operational_router.classify_operational_query("How many patients are waiting?") == (
        OperationalIntent.QUEUE_STATUS,
        "rules",
    )


def test_agentrouter_timeout_falls_back_to_rules(monkeypatch):
    monkeypatch.setattr(settings, "AGENTROUTER_API_KEY", "mock-only-key")

    def timeout(*_args, **_kwargs):
        raise TimeoutError("synthetic timeout")

    monkeypatch.setattr(operational_router.urllib.request, "urlopen", timeout)

    assert operational_router.classify_operational_query("Where are capacity bottlenecks?") == (
        OperationalIntent.BOTTLENECKS,
        "rules",
    )


def test_mcp_failure_returns_error_without_fabricated_facts(
    monkeypatch, test_session_factory, supervisor_id
):
    def fail(_session_factory=None):
        raise RuntimeError("synthetic MCP failure")

    monkeypatch.setattr(ReadOnlyMzimaMCP, "get_live_queue_summary", fail)
    with test_session_factory() as db:
        result = operational_router.run_operational_query(
            db, "How many patients are currently waiting?", supervisor_id
        )

    assert result["status"] == "error"
    assert result["facts"] == {}
    assert result["recommendations"] == []
    assert result["error_type"] == "RuntimeError"
    assert "No figures" in result["explanation"]


def test_supervisor_recommendations_are_marked_advisory(
    monkeypatch, test_session_factory, supervisor_id
):
    recommendation = {
        "id": "synthetic-rec-1",
        "suggested_action": "Supervisor review of capacity",
        "status": "pending",
    }
    monkeypatch.setattr(
        ReadOnlyMzimaMCP,
        "get_supervisor_recommendations",
        lambda _service_point=None, _limit=100, _session_factory=None: json.dumps(
            [recommendation]
        ),
    )
    with test_session_factory() as db:
        result = operational_router.run_operational_query(
            db,
            "What adjustments do you recommend to the supervisor?",
            supervisor_id,
        )

    assert result["status"] == "ok"
    assert result["recommendations"] == [
        {**recommendation, "advisory": True, "requires_human_review": True}
    ]
    assert result["requires_human_review"] is True
    assert "no operational action was executed" in result["explanation"]
