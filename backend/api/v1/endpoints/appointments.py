import uuid
<<<<<<< HEAD:app/api/v1/endpoints/appointments.py
from contextlib import nullcontext
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import RoleChecker, get_current_user, get_db
from app.core.config import settings
from app.mcp.appointment_tools import get_appointment_slots, score_and_propose_route
from app.models.domain import (
=======
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.api.deps import RoleChecker, get_current_user, get_db
from backend.models.domain import (
>>>>>>> upstream/main:backend/api/v1/endpoints/appointments.py
    AppointmentRequest,
    ClinicianDecision,
    RoleEnum,
    User,
)
from backend.schemas.domain import (
    AppointmentRequestCreate,
    AppointmentRequestResponse,
    AppointmentSlotResponse,
    ClinicianDecisionCreate,
    ClinicianDecisionResponse,
)
<<<<<<< HEAD:app/api/v1/endpoints/appointments.py
from app.services.audit.service import log_audit_event
from app.services.appointments.local_agent import (
    LocalAgentError,
    commit_via_mcp_sync,
    run_local_agent_sync,
)
from app.services.appointments.workflow import issue_approval_token
=======
from backend.services.audit.service import log_audit_event
from backend.adapters.clinic.mock_fhir import MockClinicFHIRAdapter
>>>>>>> upstream/main:backend/api/v1/endpoints/appointments.py

router = APIRouter()


@router.post(
    "/appointment-requests",
    response_model=AppointmentRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_appointment_request(
    request_in: AppointmentRequestCreate, db: Session = Depends(get_db)
):
    proposal = score_and_propose_route(db, request_in.requested_specialty)
    app_request = AppointmentRequest(
        patient_identifier=request_in.patient_identifier,
        requested_specialty=request_in.requested_specialty,
        status="PENDING_REVIEW",
        proposed_slot_id=uuid.UUID(proposal["slot_id"]) if proposal["slot_id"] else None,
        agent_proposal=proposal,
    )
    db.add(app_request)
    db.commit()
    db.refresh(app_request)

    log_audit_event(
        db,
        actor_id=None,
        action="SUBMIT_APPOINTMENT_REQUEST",
        entity_type="AppointmentRequest",
        entity_id=str(app_request.id),
        payload={"specialty": request_in.requested_specialty, "proposal": proposal},
    )

    if settings.LOCAL_AGENT_ENABLED:
        try:
            proposal = run_local_agent_sync(
                str(app_request.id),
                app_request.requested_specialty,
                lambda: nullcontext(db),
            )
            app_request.agent_proposal = proposal
            app_request.proposed_slot_id = (
                uuid.UUID(proposal["slot_id"]) if proposal.get("slot_id") else None
            )
            db.commit()
            db.refresh(app_request)
        except Exception as exc:
            log_audit_event(
                db,
                actor_id=None,
                action="LOCAL_AGENT_HANDOFF",
                entity_type="AppointmentRequest",
                entity_id=str(app_request.id),
                payload={"error_type": type(exc).__name__},
            )

    return app_request


@router.get("/slots", response_model=list[AppointmentSlotResponse])
def list_available_slots(specialty: str, db: Session = Depends(get_db)):
    return get_appointment_slots(db, specialty)


@router.get(
    "/clinic/review-queue",
    response_model=list[AppointmentRequestResponse],
    dependencies=[
        Depends(RoleChecker([RoleEnum.SHIFT_LEAD, RoleEnum.ADMIN]))
    ],
)
def get_appointment_review_queue(db: Session = Depends(get_db)):
    return (
        db.query(AppointmentRequest)
        .filter(AppointmentRequest.status == "PENDING_REVIEW")
        .all()
    )


@router.post(
    "/appointment-requests/{request_id}/decision",
    response_model=ClinicianDecisionResponse,
    dependencies=[
        Depends(RoleChecker([RoleEnum.SHIFT_LEAD, RoleEnum.ADMIN]))
    ],
)
def submit_clinician_decision(
    request_id: uuid.UUID,
    decision_in: ClinicianDecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app_request = (
        db.query(AppointmentRequest)
        .filter(AppointmentRequest.id == request_id)
        .with_for_update()
        .first()
    )
    if not app_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment request not found",
        )

    if app_request.status != "PENDING_REVIEW":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Appointment request has already been decided",
        )

    approval_token = issue_approval_token(
        request_id=app_request.id,
        clinician_id=current_user.id,
        decision=decision_in.decision,
        reason=decision_in.reason,
    )
    result = commit_via_mcp_sync(approval_token, lambda: nullcontext(db))
    if result.get("status") == "ERROR":
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=result["detail"])

    decision = (
        db.query(ClinicianDecision)
        .filter(ClinicianDecision.request_id == app_request.id)
        .one()
    )
    return decision


@router.get(
    "/appointments/{request_id}",
    response_model=AppointmentRequestResponse,
    dependencies=[
        Depends(
            RoleChecker(
                [RoleEnum.CLERK, RoleEnum.NURSE, RoleEnum.SHIFT_LEAD, RoleEnum.ADMIN]
            )
        )
    ],
)
def get_appointment_details(request_id: uuid.UUID, db: Session = Depends(get_db)):
    app_request = (
        db.query(AppointmentRequest)
        .filter(AppointmentRequest.id == request_id)
        .first()
    )
    if not app_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment request not found",
        )
    return app_request


@router.post(
    "/appointment-requests/{request_id}/sync",
    response_model=AppointmentRequestResponse,
    dependencies=[Depends(RoleChecker([RoleEnum.SHIFT_LEAD, RoleEnum.ADMIN]))],
)
def sync_approved_appointment(
    request_id: uuid.UUID,
    idempotency_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Synchronize an approved request to the facility-approved mock adapter.

    The adapter boundary is intentionally explicit: replacing the mock with a
    facility-approved HMIS/FHIR client does not change the review contract.
    """
    request = db.query(AppointmentRequest).filter(AppointmentRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Appointment request not found")
    if request.status != "APPROVED":
        raise HTTPException(status_code=409, detail="Only approved requests can be synchronized")
    if request.integration_idempotency_key and request.integration_idempotency_key != idempotency_key:
        raise HTTPException(status_code=409, detail="Request was already synchronized with another idempotency key")
    if request.integration_status == "SYNCED":
        return request

    resource = MockClinicFHIRAdapter.export_to_fhir_appointment(request)
    request.integration_status = "SYNCED"
    request.external_system = "mock_fhir_facility_adapter"
    request.external_reference = resource["id"]
    request.integration_idempotency_key = idempotency_key
    request.integrated_at = datetime.utcnow()
    db.commit()
    db.refresh(request)
    log_audit_event(
        db,
        actor_id=current_user.id,
        action="SYNC_APPROVED_APPOINTMENT",
        entity_type="AppointmentRequest",
        entity_id=str(request.id),
        payload={"system": request.external_system, "external_reference": request.external_reference},
    )
    return request
