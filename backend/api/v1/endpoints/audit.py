from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.api.deps import RoleChecker, get_db
from backend.models.domain import AuditEvent, RoleEnum

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get(
    "/events",
    dependencies=[Depends(RoleChecker([RoleEnum.SHIFT_LEAD, RoleEnum.ADMIN]))],
)
def list_audit_events(
    entity_type: str | None = Query(default=None),
    entity_id: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(AuditEvent)
    if entity_type:
        query = query.filter(AuditEvent.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditEvent.entity_id == entity_id)
    rows = query.order_by(AuditEvent.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": str(row.id),
            "actor_id": str(row.actor_id) if row.actor_id else None,
            "action": row.action,
            "entity_type": row.entity_type,
            "entity_id": row.entity_id,
            "timestamp": row.timestamp.isoformat() if row.timestamp else None,
            "payload": row.payload or {},
        }
        for row in rows
    ]
