"""Bounded natural-language routing to existing, read-only operational services."""

from __future__ import annotations

import json
import re
import urllib.request
import asyncio
from contextlib import nullcontext
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.agent.schemas import OperationalIntent, OperationalIntentClassification
from backend.mcp.server import create_mcp_server


_ALLOWED_INTENTS = {intent.value for intent in OperationalIntent}


def _rule_intent(query: str) -> OperationalIntent:
    text = query.casefold()
    if any(word in text for word in ("recommend", "recommendation", "adjustment", "suggest")):
        return OperationalIntent.SUPERVISOR_RECOMMENDATIONS
    if any(word in text for word in ("slot", "appointment")) or "backlog" in text:
        return OperationalIntent.AVAILABLE_SLOTS
    if "bottleneck" in text or "capacity" in text:
        return OperationalIntent.BOTTLENECKS
    if any(word in text for word in ("why", "explain", "growing", "increasing", "rising")) and "queue" in text:
        return OperationalIntent.EXPLAIN_QUEUE_GROWTH
    if any(word in text for word in ("longest", "which clinic", "which service point")):
        return OperationalIntent.LONGEST_QUEUE
    if any(word in text for word in ("queue", "waiting", "wait time", "patients waiting")):
        return OperationalIntent.QUEUE_STATUS
    return OperationalIntent.UNSUPPORTED


def _agentrouter_classification(query: str) -> OperationalIntentClassification | None:
    if not settings.AGENTROUTER_API_KEY:
        return None

    base = settings.AGENTROUTER_BASE_URL.rstrip("/")
    url = f"{base}/chat/completions" if base.endswith("/v1") else f"{base}/v1/chat/completions"
    intent_values = ", ".join(sorted(_ALLOWED_INTENTS))
    payload = {
        "model": settings.AGENTROUTER_MODEL,
        "temperature": 0.0,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Classify the supervisor's operational question. Return one JSON object with "
                    f"an intent field, one of: {intent_values}. Do not answer the question, "
                    "estimate metrics, or invent data. Use unsupported when it is not operational."
                ),
            },
            {"role": "user", "content": query},
        ],
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.AGENTROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=settings.AGENTROUTER_TIMEOUT_SECONDS) as response:
            data = json.loads(response.read().decode("utf-8"))
        content = data["choices"][0]["message"]["content"]
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if not match:
            return None
        result = OperationalIntentClassification.model_validate_json(match.group(0))
        return result
    except Exception:
        return None


def classify_operational_query(query: str) -> tuple[OperationalIntent, str]:
    """Use a bounded AgentRouter classification when available, otherwise keywords."""
    if settings.AGENTROUTER_API_KEY:
        classification = _agentrouter_classification(query)
        if classification is not None:
            return classification.intent, "agentrouter"
    return _rule_intent(query), "rules"


def _empty_result(
    intent: OperationalIntent,
    source: str,
    status: str,
    explanation: str,
    tools: list[str] | None = None,
    error_type: str | None = None,
) -> dict[str, Any]:
    return {
        "intent": intent.value,
        "classification_source": source,
        "status": status,
        "facts": {},
        "evidence": [],
        "explanation": explanation,
        "recommendations": [],
        "requires_human_review": True,
        "tools_invoked": tools or [],
        "error_type": error_type,
    }


def _normalize_workload(summary: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(summary)
    if not normalized.get("capacity_per_hour"):
        normalized["utilisation"] = None
        normalized["capacity_gap"] = None
        normalized["capacity_measurement_status"] = "unavailable_no_configured_capacity"
    return normalized


def _root_error_type(error: BaseException) -> str:
    while isinstance(error, BaseExceptionGroup) and error.exceptions:
        error = error.exceptions[0]
    return type(error).__name__


def _mcp_result_value(result: Any) -> Any:
    if result.isError:
        raise RuntimeError("Operational MCP tool returned an error")
    structured = getattr(result, "structuredContent", None)
    if structured is not None:
        if isinstance(structured, dict) and set(structured) == {"result"}:
            return structured["result"]
        return structured
    for block in result.content:
        text = getattr(block, "text", None)
        if text:
            return json.loads(text)
    raise ValueError("Operational MCP tool returned no structured result")


def _invoke_mcp_tools(
    db: Session,
    actor_id: UUID,
    calls: list[tuple[str, dict[str, Any]]],
) -> dict[str, Any]:
    async def invoke() -> dict[str, Any]:
        from mcp.shared.memory import create_connected_server_and_client_session

        server = create_mcp_server(lambda: nullcontext(db), actor_id=actor_id)
        results: dict[str, Any] = {}
        async with create_connected_server_and_client_session(server) as session:
            await session.initialize()
            for name, arguments in calls:
                result = await session.call_tool(name, arguments)
                results[name] = _mcp_result_value(result)
        return results

    return asyncio.run(invoke())


def run_operational_query(
    db: Session, query: str, actor_id: UUID
) -> dict[str, Any]:
    """Route a query through registered MCP tools; never synthesize metrics."""
    intent, source = classify_operational_query(query)
    if intent is OperationalIntent.UNSUPPORTED:
        return _empty_result(
            intent,
            source,
            "unsupported",
            "This query is outside the supported operational intents. No operational data was queried.",
        )

    tools: list[str] = []
    try:
        if intent is OperationalIntent.QUEUE_STATUS:
            tool = "get_live_queue_summary_tool"
            tools.append(tool)
            summary = _invoke_mcp_tools(db, actor_id, [(tool, {})])[tool]
            waiting = summary["total_in_queue"]
            explanation = (
                "No patients are currently recorded in the active walk-in queue."
                if waiting == 0
                else "Queue counts and flags are retrieved from the ranked active walk-in queue."
            )
            return {
                "intent": intent.value,
                "classification_source": source,
                "status": "empty" if waiting == 0 else "ok",
                "facts": summary,
                "evidence": ["backend.services.queue.engine.get_weighted_queue"],
                "explanation": explanation,
                "recommendations": [],
                "requires_human_review": True,
                "tools_invoked": tools,
            }

        if intent is OperationalIntent.LONGEST_QUEUE:
            tool = "get_clinic_workload_summaries_tool"
            tools.append(tool)
            workloads = _invoke_mcp_tools(db, actor_id, [(tool, {})])[tool]
            if not workloads:
                return _empty_result(
                    intent,
                    source,
                    "empty",
                    "No service-point workload data is recorded, so the longest queue cannot be identified.",
                    tools,
                )
            workloads = [_normalize_workload(row) for row in workloads]
            ranked = sorted(
                workloads,
                key=lambda row: (-row["queue_length"], row["service_point"]),
            )
            longest = ranked[0]
            return {
                "intent": intent.value,
                "classification_source": source,
                "status": "empty" if longest["queue_length"] == 0 else "ok",
                "facts": {"service_points": workloads, "longest_queue": longest},
                "evidence": ["backend.services.flow.capacity.flow_summary"],
                "explanation": (
                    "No patients are currently recorded waiting at the configured service points."
                    if longest["queue_length"] == 0
                    else "The selected service point has the highest measured active queue length among the returned service points."
                ),
                "recommendations": [],
                "requires_human_review": True,
                "tools_invoked": tools,
            }

        if intent in {OperationalIntent.BOTTLENECKS, OperationalIntent.EXPLAIN_QUEUE_GROWTH}:
            workload_tool = "get_clinic_workload_summary_tool"
            bottleneck_tool = "get_bottleneck_alerts_tool"
            if intent is OperationalIntent.EXPLAIN_QUEUE_GROWTH:
                tools.append(workload_tool)
                calls = [(workload_tool, {})]
            else:
                workload = None
            tools.append(bottleneck_tool)
            calls = calls + [(bottleneck_tool, {})] if intent is OperationalIntent.EXPLAIN_QUEUE_GROWTH else [(bottleneck_tool, {})]
            results = _invoke_mcp_tools(db, actor_id, calls)
            if intent is OperationalIntent.EXPLAIN_QUEUE_GROWTH:
                workload = _normalize_workload(results[workload_tool])
            alerts = results[bottleneck_tool]
            evidence = [
                "backend.services.flow.capacity.flow_summary",
                "recorded pending bottleneck_alerts",
            ]
            if not alerts:
                explanation = (
                    "No pending recorded bottleneck alerts are available; this does not establish that no bottleneck exists."
                )
                facts = {"workload": workload, "bottlenecks": []} if workload is not None else {"bottlenecks": []}
                result_status = "empty"
            else:
                explanations = [
                    f"{alert['service_point']}: recorded {alert['metric_name']}="
                    f"{alert['metric_value']} with stored threshold {alert['threshold_value']} "
                    f"(alert {alert['alert_code']}); this is recorded alert evidence, not causal proof."
                    for alert in alerts
                ]
                explanation = " ".join(explanations)
                facts = {"workload": workload, "bottlenecks": alerts} if workload is not None else {"bottlenecks": alerts}
                result_status = "ok"
            return {
                "intent": intent.value,
                "classification_source": source,
                "status": result_status,
                "facts": facts,
                "evidence": evidence,
                "explanation": explanation,
                "recommendations": [],
                "requires_human_review": True,
                "tools_invoked": tools,
            }

        if intent is OperationalIntent.AVAILABLE_SLOTS:
            tool = "get_available_appointment_slots_tool"
            tools.append(tool)
            slots = _invoke_mcp_tools(db, actor_id, [(tool, {})])[tool]
            return {
                "intent": intent.value,
                "classification_source": source,
                "status": "empty" if not slots else "ok",
                "facts": {"available_slots": slots},
                "evidence": ["backend.services.appointments.tools.get_appointment_slots"],
                "explanation": (
                    "No future appointment slots with remaining capacity were found."
                    if not slots
                    else "These are matching future slots with remaining capacity; they are not bookings."
                ),
                "recommendations": [],
                "requires_human_review": True,
                "tools_invoked": tools,
            }

        if intent is OperationalIntent.SUPERVISOR_RECOMMENDATIONS:
            tool = "get_supervisor_recommendations_tool"
            tools.append(tool)
            rows = _invoke_mcp_tools(db, actor_id, [(tool, {})])[tool]
            recommendations = [
                {
                    **row,
                    "advisory": True,
                    "requires_human_review": True,
                }
                for row in rows
            ]
            return {
                "intent": intent.value,
                "classification_source": source,
                "status": "empty" if not rows else "ok",
                "facts": {"recorded_recommendation_count": len(rows)},
                "evidence": ["recorded operational_recommendations"],
                "explanation": (
                    "No pending supervisor recommendations are recorded."
                    if not rows
                    else "Recommendations are advisory only and require supervisor review; no operational action was executed."
                ),
                "recommendations": recommendations,
                "requires_human_review": True,
                "tools_invoked": tools,
            }
    except Exception as exc:
        db.rollback()
        return _empty_result(
            intent,
            source,
            "error",
            "Operational data could not be retrieved. No figures or recommendations are available from this request.",
            tools,
            _root_error_type(exc),
        )

    return _empty_result(
        OperationalIntent.UNSUPPORTED,
        source,
        "unsupported",
        "This query is outside the supported operational intents. No operational data was queried.",
        tools,
    )
