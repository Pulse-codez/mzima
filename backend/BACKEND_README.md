# Mzima Backend

FastAPI backend for walk-in queue management, flow operations, and clinician-reviewed synthetic appointment requests. `backend/pyproject.toml`, `backend/uv.lock`, and the root `alembic.ini` are authoritative. Neon PostgreSQL is required, with `DATABASE_URL` for application traffic and `DATABASE_URL_UNPOOLED` for migrations. Appointment proposals are deterministic; a local model is optional and cannot approve or book.

## Implemented behavior

- Walk-in check-in records age band, visit type, and red flags. Any true red-flag value marks the visit as fast-track.
- The queue ranks fast-track visits first, then visits waiting at least 120 minutes, then the highest age-weighted wait score. The score is `minutes_waited * age_weight`; `under_5` and `over_65` use a weight of `1.5`, and other age bands use `1.0`.
- Staff can call a queued visit and complete its triage. Call overrides and workflow actions are written to audit records.
- Appointment requests select the earliest future slot matching the requested service and store tool evidence. The proposal does not infer a diagnosis or clinical priority.
- Shift leads and admins can reject or approve a proposal. Approval atomically reserves one unit of slot capacity; no-match and stale-capacity proposals cannot be approved as bookings. Decisions and tool evidence are audited.
- FastMCP exposes read-only queue/workload/bottleneck/recommendation data and appointment slot/proposal tools over stdio. The optional loopback-only local model is allowlisted to slot lookup and proposal tools; clinician approval remains a separate authenticated API action.
- Role checks protect selected staff actions; not every read or submission endpoint currently requires authentication.

## API endpoints

All versioned endpoints use the `/api/v1` prefix.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/login` | Obtain a bearer token |
| `GET` | `/auth/me` | Read the authenticated user |
| `POST` | `/visits` | Check in a walk-in visit |
| `GET` | `/queue` | List visits in queue order |
| `POST` | `/queue/{visit_id}/call` | Call a visit, optionally recording an override reason |
| `POST` | `/visits/{visit_id}/triage` | Record triage category and destination |
| `POST` | `/appointments/appointment-requests` | Submit an appointment request |
| `GET` | `/appointments/slots?specialty=General%20outpatient` | List future slots with remaining capacity |
| `GET` | `/appointments/clinic/review-queue` | List pending requests |
| `POST` | `/appointments/appointment-requests/{request_id}/decision` | Reject or approve and book the proposed slot |
| `GET` | `/appointments/appointments/{request_id}` | Read appointment request details |

Health checks are available at `GET /health` and `GET /ready`; the latter checks database connectivity.

## Local synthetic setup

Requirements: Python 3.11+ and Node.js 20+.

Run these commands from the repository root:

1. Install the backend project and test dependencies with `uv sync --project backend --extra dev` or `python -m pip install -e "backend[dev]"`.
2. Copy `.env.example` to `.env` and configure the Neon pooled and direct connection strings.
3. Create/update the configured schema with `uv run --project backend alembic -c alembic.ini upgrade head`. With Neon, this uses `DATABASE_URL_UNPOOLED` when it is set.
4. Add synthetic queue/request records and create local staff accounts with `uv run --project backend python -m scripts.seed_data`. It prints randomly generated demo account passwords once; save them locally.
5. Start the API with `uv run --project backend uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000`.
6. In another terminal, from the repository root, run `npm install`, then `npm run dev`. Open `http://localhost:5173`; Vite proxies API requests to the backend.

The patient form accepts synthetic patient identifiers only. Staff pages use generated accounts and role checks enforced by the API. Seeded appointments are synthetic. This local setup is for development and demonstrations, not live care.

To configure Neon, provide secured pooled `DATABASE_URL` and direct `DATABASE_URL_UNPOOLED` values in a private `.env`, then run the same migration and API commands. Never use demo accounts or development signing keys for a deployment. Interactive API documentation is available at `/docs`. The configured roles are `clerk`, `nurse`, `shift_lead`, and `admin`.

## AgentRouter and local MCP agent

The AgentRouter extraction endpoint converts supplied text into observation fields and returns `requires_human_review: true`; it does not diagnose or assign priority. A previous environment attempt received 401 from AgentRouter, so provider access should be verified before relying on extraction.

The appointment local agent is disabled by default. To enable it, configure `LOCAL_AGENT_ENABLED`, a loopback `LOCAL_MODEL_BASE_URL`, `LOCAL_MODEL_NAME`, and `LOCAL_MODEL_API_KEY`. Its tool allowlist contains only slot lookup and proposal creation. Booking or rejection is not exposed to the model and requires a separate authenticated shift-lead/admin decision. The stdio MCP server registers read-only queue/workload and recorded operational alerts/recommendations alongside the bounded appointment tools. Operational MCP tools require an authenticated embedding host to create the server with an active shift-lead/admin `actor_id`; the standalone `uv run python -m backend.mcp.server` process has no such identity and fails closed for those tools. Stdio is local-process access, not an authenticated network endpoint. The supported HTTP operational-query entry point is `POST /api/v1/flow/operational-query`.

## Testing

Run the isolated tests from the repository root with `TEST_DATABASE_URL=<isolated-postgres-url> uv run --project backend pytest -v`. The phase helper scripts use the same isolated PostgreSQL setting:

```bash
TEST_DATABASE_URL=<isolated-postgres-url> uv run --project backend python -m scripts.test_phase5
TEST_DATABASE_URL=<isolated-postgres-url> uv run --project backend python -m scripts.test_phase6
```

This is a development prototype, not a clinical decision system. Use synthetic data only; clinical workflow changes require authorized staff decisions. LangGraph orchestration, real clinic scheduling integration, and clinical/model evaluations are not implemented.
