# Backend reference

This is the implementation reference for the current backend. It answers four questions: how Neon and migrations fit together, how AgentRouter is used, what the backend packages do, and which HTTP endpoints exist.

## 1. Do we need Alembic if the database is Neon?

Yes. Neon is the PostgreSQL provider; it does not replace schema migration tooling. Alembic records schema changes as versioned Python migration files and applies them to the selected Neon branch.

The distinction is:

| Concern | Current implementation |
|---|---|
| Database | Neon PostgreSQL |
| Application connection | Pooled `DATABASE_URL` |
| Migration connection | Direct `DATABASE_URL_UNPOOLED` |
| Schema source of truth | SQLAlchemy models plus Alembic revisions |
| Migration location | `backend/migrations/versions/` |
| Migration config | Root `alembic.ini`, pointing to `backend/migrations` |

Use the direct connection for migrations because DDL and migration locks should not run through the pooler:

```bash
uv run --project backend alembic -c alembic.ini upgrade head
```

Running SQL manually in the Neon console can change the database, but it does not create a repeatable migration history and will eventually make environments diverge. `Base.metadata.create_all()` is also not the migration strategy for this project.

## 2. How AgentRouter is used

AgentRouter is optional. It is not the database, the API server, the MCP server, or the appointment booking authority. The backend makes two bounded OpenAI-compatible calls when `AGENTROUTER_API_KEY` is configured.

### A. Observation extraction

Endpoint:

```text
POST /api/v1/flow/observations/extract
```

Flow:

```text
Staff text
  → AgentRouter chat/completions
  → JSON field extraction
  → allowlist of observation fields
  → response marked requires_human_review=true
```

The allowed fields are vital signs and structured observation fields such as temperature, pulse, respiratory rate, oxygen saturation, AVPU, pallor, symptoms, and a symptom summary. The prompt explicitly forbids diagnosis and priority assignment. The result is not automatically written as a clinical decision.

Implementation: `backend/services/flow/llm_extraction.py`.

### B. Operational query classification

Endpoint:

```text
POST /api/v1/flow/operational-query
```

Flow:

```text
Supervisor query
  → AgentRouter classifies one bounded intent
  → backend invokes registered MCP read tools
  → database facts and evidence are returned
  → response remains advisory and requires human review
```

Supported intents are queue status, longest queue, bottlenecks, queue-growth explanation, available appointment slots, and supervisor recommendations. If AgentRouter is unavailable, the backend uses deterministic keyword rules. AgentRouter never supplies metrics or recommendations directly; it only classifies the question.

Implementation: `backend/agent/operational_router.py`.

### Configuration

```env
AGENTROUTER_API_KEY=...
BASE_URL=https://agentrouter.org/v1
MODEL_NAME=gpt-4o-mini
```

`AGENTROUTER_BASE_URL` and `AGENTROUTER_MODEL` are the explicit equivalents. The backend calls `/chat/completions`, uses a short timeout, validates the returned JSON, and falls back or fails closed when the response is unusable.

AgentRouter is separate from the optional local appointment model. The local appointment model uses the loopback-only `LOCAL_MODEL_BASE_URL`, not AgentRouter.

## 3. Backend package responsibilities

### `backend/models/`

SQLAlchemy persistence models. They describe database tables and relationships; they do not define HTTP behavior.

Core domain models in `domain.py`:

- `User`: staff identity, password hash, role, and active state.
- `Visit`: walk-in record, queue status, age band, red flags, triage, and destination.
- `QueueEvent`: calls and queue overrides.
- `AppointmentRequest`: requested specialty, proposal, decision status, and integration state.
- `AppointmentSlot`: configured future capacity.
- `ClinicianDecision`: one audited clinician decision per appointment request.
- `AuditEvent`: actor, action, entity, timestamp, and minimized payload.

Operational models in `flow.py`:

- Observations and triage source documents/rules.
- Clinical review alerts and reviewer outcomes.
- Assessment stations, staffing shifts, and capacity snapshots.
- Bottleneck alerts and operational recommendations.
- Simulation scenarios/results and flow metric snapshots.
- Public-health context and operational threshold sets.

### `backend/mcp/`

`backend/mcp/server.py` exposes a local FastMCP server over stdio. It is an adapter around existing backend services, not a second database layer.

Operational tools are read-only and require an authenticated shift-lead/admin actor when created through the operational query path. Appointment tools can read slots and create a pending proposal. The commit tool accepts only a short-lived, signed clinician approval token.

The server exposes tools for:

- Ranked queue summary.
- Pending appointment reviews.
- Clinic workload summaries.
- Bottleneck alerts.
- Supervisor recommendations.
- Available appointment slots.
- Appointment slot lookup by specialty.
- Deterministic route/proposal creation.
- Clinician-approved commit/rejection.

The standalone stdio process has no authenticated actor, so protected operational tools fail closed. It is not a public HTTP endpoint.

### `backend/adapters/`

Adapters translate Mzima data into an external system’s contract. The current implementation contains `MockClinicFHIRAdapter`, which converts an approved appointment into a FHIR-shaped `Appointment` dictionary.

It does not make a network request and is not a live FHIR/HMIS integration. The appointment sync endpoint stores the generated resource’s reference and idempotency key so a future facility-specific adapter can replace the mock boundary.

### `backend/agent/`

This package contains two bounded agent-related paths:

- `operational_router.py`: classifies supervisor questions with AgentRouter or deterministic rules, then invokes MCP read tools and returns evidence-backed facts.
- `workflow.py`: small appointment proposal helper that creates a `PROPOSED_BY_AGENT` request and checks that it was not directly approved. It is not the main approval implementation.

The optional local appointment loop is in `backend/services/appointments/local_agent.py`. It can call only slot lookup and proposal tools. The authoritative approval path is `backend/services/appointments/workflow.py`, which validates the clinician token, locks the request, reserves capacity transactionally, records the decision, and writes an audit event.

## 4. HTTP API

All business endpoints are under `/api/v1`.

### Health and compatibility

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Liveness response |
| GET | `/ready` | Checks Neon database connectivity |
| GET | `/v1/models` | OpenAI-compatible model listing |

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/login` | OAuth2 form login; returns bearer JWT |
| GET | `/api/v1/auth/me` | Returns the current authenticated user |

### Walk-in queue

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/visits` | Clerk/admin checks in a visit |
| GET | `/api/v1/queue` | Lists the deterministic weighted queue |
| POST | `/api/v1/queue/{visit_id}/call` | Nurse/lead/admin calls a visit |
| POST | `/api/v1/visits/{visit_id}/triage` | Nurse/lead/admin records triage completion |

### Appointments

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/appointments/appointment-requests` | Creates a request and deterministic slot proposal |
| GET | `/api/v1/appointments/slots` | Lists future slots by specialty and date range |
| GET | `/api/v1/appointments/clinic/review-queue` | Lists requests pending clinician review |
| POST | `/api/v1/appointments/appointment-requests/{request_id}/decision` | Approves or rejects with clinician approval token |
| GET | `/api/v1/appointments/appointments/{request_id}` | Reads appointment details for staff roles |
| POST | `/api/v1/appointments/appointment-requests/{request_id}/sync` | Sends an approved appointment through the mock adapter with an idempotency key |

### Flow and operations

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/flow/operational-query` | Supervisor query routed through bounded classification and MCP read tools |
| GET | `/api/v1/flow/summary` | Current workload summary |
| GET | `/api/v1/flow/wait-metrics` | Wait-time metrics |
| GET | `/api/v1/flow/pilot-validation` | Compares recorded baseline/latest snapshots |
| POST/GET | `/api/v1/flow/metric-snapshots` | Create/list flow metric snapshots |
| GET/POST/PATCH | `/api/v1/flow/stations`, `/api/v1/flow/stations/{station_id}` | Manage assessment stations |
| GET/POST | `/api/v1/flow/staffing` | List/create staffing records |
| POST | `/api/v1/flow/capacity/snapshot` | Record capacity state |
| POST/GET | `/api/v1/flow/bottleneck-scan`, `/api/v1/flow/bottlenecks` | Detect and list bottlenecks |
| POST | `/api/v1/flow/bottlenecks/{alert_id}/review` | Review a bottleneck alert |
| POST/GET | `/api/v1/flow/recommendations/scan`, `/api/v1/flow/recommendations` | Generate/list recommendations |
| POST | `/api/v1/flow/recommendations/{recommendation_id}/review` | Review a recommendation |
| GET/POST | `/api/v1/flow/clinical-alerts`, `/api/v1/flow/clinical-alerts/{alert_id}/review` | List/review clinical warning alerts |
| GET/POST | `/api/v1/flow/observations` | List/create observations |
| POST | `/api/v1/flow/observations/extract` | Optional AgentRouter observation extraction |
| GET | `/api/v1/flow/triage-sources` | Lists triage source documents |
| GET | `/api/v1/flow/public-health-context` | Reports whether verified context has been seeded |
| POST/GET | `/api/v1/flow/simulations`, `/api/v1/flow/simulations/{scenario_id}` | Create/read capacity simulations |

### Audit

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/audit/events` | Shift leads/admins query audit events by entity and limit |

## 5. Security and workflow rules

- The frontend is not a security boundary; FastAPI role checks are authoritative.
- Appointment approval requires an active shift lead/admin, a short-lived signed token, an unexpired proposal, and available slot capacity.
- Model calls can extract or classify; they cannot approve, diagnose, assign clinical priority, or reserve capacity.
- The MCP server cannot access operational data without an authorized actor.
- All demonstrations and tests must use synthetic data.
