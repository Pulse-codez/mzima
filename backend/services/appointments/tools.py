import uuid
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import update
from sqlalchemy.orm import Session

from backend.models.domain import AppointmentSlot

DEFAULT_PROPOSAL_TTL_HOURS = 24


def get_appointment_slots(
    db: Session,
    specialty: str,
    now: datetime | None = None,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
) -> list[AppointmentSlot]:
    cleaned_specialty = specialty.strip()
    if not cleaned_specialty:
        raise ValueError("Specialty must not be empty")

    if from_date is not None and to_date is not None and from_date > to_date:
        raise ValueError("from_date must not be later than to_date")

    current_time = now or datetime.utcnow()
    lower_bound = max(current_time, from_date) if from_date is not None else current_time

    query = db.query(AppointmentSlot).filter(
        AppointmentSlot.specialty == cleaned_specialty,
        AppointmentSlot.starts_at >= lower_bound,
        AppointmentSlot.booked_count < AppointmentSlot.capacity,
    )

    if to_date is not None:
        query = query.filter(AppointmentSlot.starts_at <= to_date)

    return query.order_by(AppointmentSlot.starts_at).all()


def score_and_propose_route(
    db: Session,
    specialty: str,
    now: datetime | None = None,
    ttl_hours: int = DEFAULT_PROPOSAL_TTL_HOURS,
) -> dict[str, Any]:
    current_time = now or datetime.utcnow()
    slots = get_appointment_slots(db, specialty, now=current_time)
    if not slots:
        return {
            "tool": "score_and_propose_route",
            "status": "NO_MATCH",
            "specialty": specialty.strip(),
            "slot_id": None,
            "proposed_at": current_time.isoformat(),
            "expires_at": None,
            "evidence": ["No available synthetic slot matches the requested service."],
            "rule_version": "synthetic-slots-v1",
        }

    slot = slots[0]
    expires_at = min(
        slot.starts_at,
        current_time + timedelta(hours=ttl_hours),
    )
    return {
        "tool": "score_and_propose_route",
        "status": "PENDING_CLINICIAN_REVIEW",
        "specialty": specialty.strip(),
        "slot_id": str(slot.id),
        "starts_at": slot.starts_at.isoformat(),
        "proposed_at": current_time.isoformat(),
        "expires_at": expires_at.isoformat(),
        "evidence": [
            "Requested service exactly matches the configured slot service.",
            "Slot has remaining capacity at proposal time.",
            "Earliest available matching slot selected; no clinical priority inferred.",
        ],
        "rule_version": "synthetic-slots-v1",
    }


def reserve_appointment_slot(
    db: Session,
    slot_id: uuid.UUID,
    specialty: str,
    now: datetime | None = None,
) -> AppointmentSlot | None:
    current_time = now or datetime.utcnow()
    result = db.execute(
        update(AppointmentSlot)
        .where(
            AppointmentSlot.id == slot_id,
            AppointmentSlot.specialty == specialty,
            AppointmentSlot.starts_at >= current_time,
            AppointmentSlot.booked_count < AppointmentSlot.capacity,
        )
        .values(booked_count=AppointmentSlot.booked_count + 1)
    )
    if result.rowcount != 1:
        return None
    db.flush()
    db.expire_all()
    return db.get(AppointmentSlot, slot_id)