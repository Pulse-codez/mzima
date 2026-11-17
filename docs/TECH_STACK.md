# Mzima technology stack

This document describes the code that exists in this repository. Future integrations are listed separately so they are not confused with implemented components.

## Runtime stack

| Layer | Technology | Location |
|---|---|---|
| Frontend | React 18, TypeScript, Vite | `src/`, root `package.json` |
| API | FastAPI, Uvicorn | `backend/main.py` |
| Validation | Pydantic v2 | `backend/schemas/` |
| Persistence | SQLAlchemy 2.x | `backend/models/`, `backend/db/` |
| Database | Neon PostgreSQL | `DATABASE_URL` / `DATABASE_URL_UNPOOLED` |
| Migrations | Alembic | `backend/migrations/`, `alembic.ini` |
| Authentication | JWT, Argon2 password hashing | `backend/core/security.py` |
| Optional tools | FastMCP over local stdio | `backend/mcp/server.py` |
| Optional model gateway | AgentRouter, OpenAI-compatible API | `backend/services/flow/llm_extraction.py` |

## Request path

```text
Browser (src/)
  → Vite proxy in development
  → FastAPI /api/v1
  → endpoint handler
  → domain service
  → SQLAlchemy session
  → Neon PostgreSQL
```

The frontend uses relative `/api` URLs. In development, Vite proxies them to `http://127.0.0.1:8000`; in deployment, configure the frontend/API origin through the hosting layer.

## Backend components

| Component | Responsibility |
|---|---|
| `backend/api/v1/endpoints/auth.py` | Login and current-user endpoints |
| `backend/api/v1/endpoints/queue.py` | Walk-in queue endpoints |
| `backend/api/v1/endpoints/appointments.py` | Request, slot, review, and decision endpoints |
| `backend/api/v1/endpoints/flow.py` | Operational metrics, alerts, simulations, and extraction |
| `backend/services/queue/` | Queue ordering and workflow rules |
| `backend/services/appointments/` | Slot lookup, proposal creation, and approval transaction |
| `backend/services/flow/` | Capacity, alerts, simulations, and source ingestion |
| `backend/services/audit/` | Audit event persistence |
| `backend/models/` | Database entities and enums |
| `backend/schemas/` | API contracts |
| `backend/adapters/clinic/` | Mock external clinic integration |

## Database rules

Neon PostgreSQL is the only supported database.

- `DATABASE_URL`: pooled connection for API requests.
- `DATABASE_URL_UNPOOLED`: direct connection for Alembic migrations and session-bound tooling.
- Schema changes are migration files under `backend/migrations/versions/`.
- The browser and optional model tools never receive database credentials.

Apply migrations with:

```bash
uv run --project backend alembic -c alembic.ini upgrade head
```

## Implemented versus future work

Implemented: REST API, JWT authentication, role checks, queue workflow, appointment proposal/review/booking workflow, audit events, Neon persistence, mock clinic adapter, and local MCP tools.

Future work: live HMIS/FHIR integration, production deployment hardening, local/in-country model hosting, and any larger agent orchestration layer. The repository does not currently use Next.js, Prisma, or LangGraph.
