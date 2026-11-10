# Mzima implementation changelog

## Scope

This document records the outpatient queue intelligence, facility integration, pilot validation, and operational observability work implemented in this checkout.

The system remains a synthetic-data prototype. It is not approved for live clinical care, autonomous triage, or production facility integration without clinical, privacy, security, and operational approval.

## Outpatient queue intelligence

### Patient registration

- Clerk registration now requires a facility patient reference.
- The reference is stored on the visit record as `patient_identifier`.
- The registration migration adds an indexed `visits.patient_identifier` column.
- The existing age-band, visit-type, and concern-flag fields remain part of registration.

### Queue tokens

- Tokens are generated per UTC facility day rather than from the lifetime visit count.
- The format is `T-YYYYMMDD-###`, for example `T-20261110-004`.
- Token generation is currently count-based and should use a database sequence or locking strategy before concurrent production writes.

### Deterministic priority rules

Queue ordering is explicit and stable:

1. Fast-track visits are first.
2. Visits at or above the 120-minute wait cap are next.
3. Remaining visits are ordered by calculated score, descending.
4. Age bands `under_5` and `over_65` receive a 1.5 wait-time weight; other age bands receive 1.0.
5. Arrival time and token number break ties deterministically.

The queue response includes waiting minutes, calculated score, wait-cap status, fast-track status, and red flags so staff can understand the operational ordering.

### Waiting time and staffing capacity

Existing flow services calculate:

- queue length;
- average and maximum wait to triage;
- average and maximum wait to assessment;
- functional and staffed assessment stations;
- available staff during the current shift;
- effective capacity per hour;
- utilisation and capacity gap.

These metrics are now surfaced in the Shift Lead dashboard alongside a pilot snapshot action.

## Auditability

- Queue check-in, patient calls, triage completion, appointment decisions, and approved appointment synchronization write audit events.
- Shift leads and administrators can retrieve recent events through `GET /api/v1/audit/events`.
- Audit results include actor, action, entity, timestamp, and minimized payload details.

## Facility integration

### Approved scheduling adapter boundary

`POST /api/v1/appointments/appointment-requests/{request_id}/sync` synchronizes an approved appointment through the existing mock FHIR adapter.

The endpoint:

- rejects requests that are not approved;
- records the external system and reference;
- stores synchronization status and timestamp;
- requires an idempotency key;
- rejects reuse with a different key;
- safely returns an already-synchronized request for the same key;
- writes an audit event.

The adapter is deliberately isolated so a facility-approved HMIS/FHIR client can replace the mock implementation without changing the review and approval contract.

## Pilot validation and operational measurement

`GET /api/v1/flow/pilot-validation` compares the earliest and latest recorded flow metric snapshots for a service point.

The response includes:

- baseline metrics;
- latest metrics;
- snapshot count;
- queue, wait-time, and utilisation changes;
- an interpretation indicating whether enough snapshots exist for comparison.

The Shift Lead dashboard can record a snapshot and display the comparison. Negative queue and wait-time changes indicate improvement; this is an operational measurement aid, not a clinical outcome claim.

## Database migration

Migration `4c2e6b7a91d0_add_registration_integration_fields.py` adds:

- `visits.patient_identifier`;
- appointment integration status;
- external system and reference;
- synchronization idempotency key;
- integration timestamp.

Run `alembic upgrade head` before using the new fields against an existing database.

## Frontend changes

- Clerk Dashboard registration now validates and submits the patient reference.
- Shift Lead Dashboard includes facility operations, capacity, pilot validation, and audit trail panels.
- Typed API helpers were added for flow summaries, snapshots, pilot validation, and audit events.
- Existing reduced-motion handling remains in place; no new decorative animation was added to frequent operational actions.

## Verification performed

- `npm run build` passed.
- Python backend bytecode compilation passed.
- Backend import, route registration, and approved FHIR adapter smoke checks passed using `backend/.venv/bin/python`.
- Full pytest execution was not available because `pytest` is not installed in the available backend environment.

## Follow-up before production or a real pilot

- Replace count-based token allocation with a transaction-safe facility-day sequence.
- Replace the mock FHIR adapter only after facility approval and contract testing.
- Add integration retry/reconciliation behavior around real external systems.
- Add authenticated end-to-end API tests with a disposable database.
- Define pilot baseline and success thresholds with the facility before interpreting improvements.
