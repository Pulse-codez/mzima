import json
import uuid
from collections.abc import Callable
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from backend.db.session import SessionLocal
from backend.models.domain import (
    AppointmentRequest,
    AppointmentSlot,
    AuditEvent,
    RoleEnum,
    User,
    Visit,
    VisitStatusEnum,
)
from backend.models.flow import AssessmentStation, BottleneckAlert, OperationalRecommendation
from backend.services.appointments.tools import (
    get_appointment_slots,
    score_and_propose_route,
)
from backend.services.appointments.workflow import ApprovalError, review_and_commit
from backend.services.audit.service import log_audit_event
from backend.services.flow.capacity import flow_summary
from backend.services.queue.engine import get_weighted_queue


class ReadOnlyMzimaMCP:
    """Read-only MCP interface for querying synthetic queue states and forecasts."""

    @staticmethod
    def get_live_queue_summary(session_factory: Callable[[], Session] | None = None) -> str:
        """Fetches ranked queue metrics and top active waiting tokens."""
        factory = session_factory or SessionLocal
        with factory() as db:
            queue = get_weighted_queue(db)
            summary = {
                "total_in_queue": len(queue),
                "fast_track_count": sum(1 for item in queue if item.is_fast_track),
                "wait_capped_count": sum(1 for item in queue if item.is_wait_capped),
                "top_tokens": [item.model_dump() for item in queue[:5]],
            }
            return json.dumps(summary, default=str)

    @staticmethod
    def get_pending_appointment_reviews(
        session_factory: Callable[[], Session] | None = None,
    ) -> str:
        """Retrieves all appointment requests currently awaiting clinician decision."""
        factory = session_factory or SessionLocal
        with factory() as db:
            requests = (
                db.query(AppointmentRequest)
                .filter(AppointmentRequest.status == "PENDING_REVIEW")
                .all()
            )
            data = [
                {
                    "id": str(req.id),
                    "patient_identifier": req.patient_identifier,
                    "specialty": req.requested_specialty,
                    "created_at": req.created_at.isoformat(),
                }
                for req in requests
            ]
            return json.dumps(data)

    @staticmethod
    def get_clinic_workload_summary(
        service_point: str | None = None,
        session_factory: Callable[[], Session] | None = None,
    ) -> str:
        factory = session_factory or SessionLocal
        with factory() as db:
            return json.dumps(flow_summary(db, service_point), default=str)

    @staticmethod
    def get_clinic_workload_summaries(
        session_factory: Callable[[], Session] | None = None,
    ) -> str:
        """Return flow-service summaries for service points present in visits or stations."""
        factory = session_factory or SessionLocal
        with factory() as db:
            visit_points = {
                row[0]
                for row in db.query(Visit.service_point)
                .filter(
                    Visit.service_point.is_not(None),
                    Visit.status.in_([VisitStatusEnum.IN_QUEUE, VisitStatusEnum.CALLED]),
                )
                .distinct()
                .all()
            }
            station_points = {
                row[0]
                for row in db.query(AssessmentStation.service_point)
                .filter(AssessmentStation.active.is_(True))
                .distinct()
                .all()
            }
            summaries = [flow_summary(db, point) for point in sorted(visit_points | station_points)]
            return json.dumps(summaries, default=str)

    @staticmethod
    def get_bottleneck_alerts(
        service_point: str | None = None,
        limit: int = 100,
        session_factory: Callable[[], Session] | None = None,
    ) -> str:
        factory = session_factory or SessionLocal
        with factory() as db:
            query = db.query(BottleneckAlert).filter(BottleneckAlert.status == "pending")
            if service_point:
                query = query.filter(BottleneckAlert.service_point == service_point)
            rows = query.order_by(BottleneckAlert.created_at.desc()).limit(limit).all()
            return json.dumps(
                [
                    {
                        "id": str(row.id),
                        "alert_code": row.alert_code,
                        "service_point": row.service_point,
                        "severity": row.severity,
                        "metric_name": row.metric_name,
                        "metric_value": row.metric_value,
                        "threshold_value": row.threshold_value,
                        "evidence": row.evidence,
                        "created_at": row.created_at.isoformat(),
                    }
                    for row in rows
                ],
                default=str,
            )

    @staticmethod
    def get_supervisor_recommendations(
        service_point: str | None = None,
        limit: int = 100,
        session_factory: Callable[[], Session] | None = None,
    ) -> str:
        factory = session_factory or SessionLocal
        with factory() as db:
            query = db.query(OperationalRecommendation).filter(
                OperationalRecommendation.status == "pending"
            )
            if service_point:
                query = query.filter(OperationalRecommendation.service_point == service_point)
            rows = query.order_by(OperationalRecommendation.created_at.desc()).limit(limit).all()
            return json.dumps(
                [
                    {
                        "id": str(row.id),
                        "recommendation_type": row.recommendation_type,
                        "service_point": row.service_point,
                        "suggested_action": row.suggested_action,
                        "rationale": row.rationale,
                        "evidence": row.evidence,
                        "status": row.status,
                        "created_at": row.created_at.isoformat(),
                    }
                    for row in rows
                ],
                default=str,
            )

    @staticmethod
    def get_available_appointment_slots(
        session_factory: Callable[[], Session] | None = None,
    ) -> str:
        """Return available future slots across specialties using the appointment service."""
        factory = session_factory or SessionLocal
        with factory() as db:
            specialties = [
                row[0]
                for row in db.query(AppointmentSlot.specialty)
                .filter(
                    AppointmentSlot.starts_at >= datetime.utcnow(),
                    AppointmentSlot.booked_count < AppointmentSlot.capacity,
                )
                .distinct()
                .all()
            ]
            slots = []
            for specialty in specialties:
                slots.extend(
                    {
                        "id": str(slot.id),
                        "specialty": slot.specialty,
                        "starts_at": slot.starts_at.isoformat(),
                        "remaining": slot.capacity - slot.booked_count,
                    }
                    for slot in get_appointment_slots(db, specialty)
                )
            slots.sort(key=lambda slot: (slot["starts_at"], slot["specialty"], slot["id"]))
            return json.dumps(slots)


def create_mcp_server(
    session_factory: Callable[[], Session] | None = None,
    actor_id: uuid.UUID | None = None,
):
    """Create the stdio MCP server; MCP is imported only when the server is used."""
    from mcp.server.fastmcp import FastMCP

    factory = session_factory or SessionLocal

    def operational_access_allowed() -> bool:
        if actor_id is None:
            return False
        with factory() as db:
            actor = db.get(User, actor_id)
            return bool(
                actor
                and actor.is_active
                and actor.role in {RoleEnum.SHIFT_LEAD, RoleEnum.ADMIN}
            )

    def run_operational_tool(tool_name: str, operation: Callable[[], Any]) -> Any:
        if not operational_access_allowed():
            raise PermissionError("Authorized supervisor/admin actor required")
        try:
            result = operation()
        except Exception as exc:
            with factory() as audit_db:
                log_audit_event(
                    audit_db,
                    actor_id=actor_id,
                    action="MCP_OPERATIONAL_QUERY",
                    entity_type="OperationalQuery",
                    entity_id=tool_name,
                    payload={"tool": tool_name, "outcome": "error", "error_type": type(exc).__name__},
                )
            raise

        if isinstance(result, dict):
            result_count = result.get("total_in_queue")
            if result_count is None:
                result_count = result.get("queue_length")
            if result_count is None and isinstance(result.get("slots"), list):
                result_count = len(result["slots"])
        else:
            result_count = len(result) if isinstance(result, list) else None
        with factory() as audit_db:
            log_audit_event(
                audit_db,
                actor_id=actor_id,
                action="MCP_OPERATIONAL_QUERY",
                entity_type="OperationalQuery",
                entity_id=tool_name,
                payload={
                    "tool": tool_name,
                    "outcome": "empty" if result_count == 0 else "ok",
                    "result_count": result_count,
                },
            )
        return result

    server = FastMCP(
        "Mzima Operational and Appointment Tools",
        instructions=(
            "Operational tools are read-only. Appointment tools may create proposals, "
            "but booking or rejection requires a valid short-lived clinician approval token."
        ),
    )

    @server.tool()
    def get_live_queue_summary_tool() -> dict[str, Any]:
        """Return the ranked current walk-in queue summary from the queue service."""
        return run_operational_tool(
            "get_live_queue_summary_tool",
            lambda: json.loads(ReadOnlyMzimaMCP.get_live_queue_summary(factory)),
        )

    @server.tool()
    def get_pending_appointment_reviews_tool() -> list[dict[str, Any]]:
        """List appointment requests awaiting clinician review."""
        return run_operational_tool(
            "get_pending_appointment_reviews_tool",
            lambda: json.loads(ReadOnlyMzimaMCP.get_pending_appointment_reviews(factory)),
        )

    @server.tool()
    def get_clinic_workload_summary_tool(service_point: str | None = None) -> dict[str, Any]:
        """Summarize queue, waits, arrivals, capacity, and utilization from flow services."""
        return run_operational_tool(
            "get_clinic_workload_summary_tool",
            lambda: json.loads(
                ReadOnlyMzimaMCP.get_clinic_workload_summary(service_point, factory)
            ),
        )

    @server.tool()
    def get_clinic_workload_summaries_tool() -> list[dict[str, Any]]:
        """Return measured workload summaries for known clinic service points."""
        return run_operational_tool(
            "get_clinic_workload_summaries_tool",
            lambda: json.loads(ReadOnlyMzimaMCP.get_clinic_workload_summaries(factory)),
        )

    @server.tool()
    def get_bottleneck_alerts_tool(
        service_point: str | None = None, limit: int = 100
    ) -> list[dict[str, Any]]:
        """List recorded pending bottleneck alerts and their measurement evidence."""
        return run_operational_tool(
            "get_bottleneck_alerts_tool",
            lambda: json.loads(
                ReadOnlyMzimaMCP.get_bottleneck_alerts(service_point, limit, factory)
            ),
        )

    @server.tool()
    def get_supervisor_recommendations_tool(
        service_point: str | None = None, limit: int = 100
    ) -> list[dict[str, Any]]:
        """List recorded advisory recommendations and their supporting evidence."""
        return run_operational_tool(
            "get_supervisor_recommendations_tool",
            lambda: json.loads(
                ReadOnlyMzimaMCP.get_supervisor_recommendations(
                    service_point, limit, factory
                )
            ),
        )

    @server.tool()
    def get_appointment_slots_tool(specialty: str) -> dict[str, Any]:
        """List future matching slots with remaining capacity."""
        with factory() as db:
            slots = get_appointment_slots(db, specialty)
            result = [
                {
                    "id": str(slot.id),
                    "specialty": slot.specialty,
                    "starts_at": slot.starts_at.isoformat(),
                    "remaining": slot.capacity - slot.booked_count,
                }
                for slot in slots
            ]
            db.add(
                AuditEvent(
                    actor_id=None,
                    action="MCP_GET_APPOINTMENT_SLOTS",
                    entity_type="AppointmentSlotQuery",
                    entity_id=specialty,
                    timestamp=datetime.utcnow(),
                    payload={"specialty": specialty, "result_count": len(result)},
                )
            )
            db.commit()
            return {"specialty": specialty, "slots": result}

    @server.tool()
    def get_available_appointment_slots_tool() -> list[dict[str, Any]]:
        """List available future appointment slots across all configured specialties."""
        return run_operational_tool(
            "get_available_appointment_slots_tool",
            lambda: json.loads(ReadOnlyMzimaMCP.get_available_appointment_slots(factory)),
        )

    @server.tool()
    def score_and_propose_route_tool(request_id: str) -> dict[str, Any]:
        """Create a deterministic pending proposal for an existing request."""
        with factory() as db:
            try:
                parsed_id = uuid.UUID(request_id)
            except ValueError:
                return {"status": "ERROR", "detail": "Invalid request ID"}
            request = db.get(AppointmentRequest, parsed_id)
            if request is None:
                return {"status": "ERROR", "detail": "Appointment request not found"}
            if request.status != "PENDING_REVIEW":
                return {"status": "ERROR", "detail": "Request is not pending review"}

            proposal = score_and_propose_route(db, request.requested_specialty)
            request.proposed_slot_id = (
                uuid.UUID(proposal["slot_id"]) if proposal["slot_id"] else None
            )
            request.agent_proposal = proposal
            db.add(
                AuditEvent(
                    actor_id=None,
                    action="MCP_SCORE_AND_PROPOSE_ROUTE",
                    entity_type="AppointmentRequest",
                    entity_id=str(request.id),
                    timestamp=datetime.utcnow(),
                    payload=proposal,
                )
            )
            db.commit()
            return proposal

    @server.tool()
    def review_and_commit_tool(approval_token: str) -> dict[str, Any]:
        """Commit a booking or rejection only with a signed clinician approval token."""
        with factory() as db:
            try:
                return review_and_commit(db, approval_token)
            except ApprovalError as exc:
                db.rollback()
                return {"status": "ERROR", "detail": str(exc)}

    return server


def main() -> None:
    create_mcp_server().run(transport="stdio")


if __name__ == "__main__":
    main()