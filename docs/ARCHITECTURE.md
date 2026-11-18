# Mzima architecture

## Scope

Mzima is a synthetic-data prototype for outpatient queue management and appointment requests. The implemented system has one web client, one FastAPI service, and one Neon PostgreSQL database.

```mermaid
flowchart LR
    Browser[React + Vite<br/>root src/] -->|HTTP /api/v1| API[FastAPI<br/>backend/main.py]
    API --> Routes[API routes<br/>auth · visits · queue · appointments · flow · audit]
    Routes --> Services[Domain services<br/>queue · flow · appointments · audit]
    Services --> ORM[SQLAlchemy models/session]
    ORM --> Neon[(Neon PostgreSQL)]
    Migrations[Alembic migrations<br/>direct Neon connection] --> Neon
    MCP[Optional local stdio MCP server] --> Services
    Services -.-> Adapter[Mock clinic adapter]
    Adapter -. future .-> HMIS[Clinic/HMIS system]
```

The browser never connects directly to Neon. The database is accessed only by the backend. `DATABASE_URL` is the pooled Neon connection for API traffic; `DATABASE_URL_UNPOOLED` is the direct connection used by Alembic.

## Repository structure

```text
src/                         Active React/Vite frontend
backend/
  main.py                    FastAPI application entry point
  api/v1/endpoints/          HTTP route handlers
  services/                  Queue, flow, appointment, and audit logic
  models/                    SQLAlchemy ORM models
  schemas/                   Pydantic request/response models
  db/session.py              PostgreSQL engine and session factory
  core/config.py             Environment settings
  mcp/server.py              Optional local stdio tools
  adapters/clinic/           Mock clinic integration
backend/migrations/          Alembic revisions
tests/                       API and workflow tests
scripts/                     Synthetic data and verification scripts
docs/                        Architecture, privacy, deployment, and product docs
```

The root `package.json`, `vite.config.ts`, and `src/` are the active frontend project.

## Main workflows

### Walk-in queue

```mermaid
sequenceDiagram
    participant Client as Staff UI
    participant API as FastAPI
    participant Queue as Queue service
    participant DB as Neon PostgreSQL

    Client->>API: POST /visits
    API->>Queue: Validate and create visit
    Queue->>DB: Save visit and audit event
    Client->>API: GET /queue
    API->>Queue: Calculate deterministic order
    Queue->>DB: Read waiting visits
    Queue-->>Client: Ordered queue
    Client->>API: Call visit / complete triage
    API->>DB: Save workflow change and audit event
```

Queue ordering is deterministic: fast-track visits first, then long waits, then the age-weighted wait score. It is an operational rule, not an automated clinical diagnosis.

### Appointment request and approval

```mermaid
flowchart LR
    Request[Appointment request] --> Match[Find future matching slots]
    Match --> Proposal[Pending proposal with evidence]
    Proposal --> Review[Shift lead/admin review]
    Review -->|Reject| Rejected[Rejected + audited]
    Review -->|Approve| Reserve[Transactionally reserve capacity]
    Reserve --> Booked[Booked + audited]
    Reserve -. optional .-> Mock[Mock clinic adapter]
```

The proposal is not a booking. Only an authenticated shift lead or admin can approve or reject it. The optional local model can assist with bounded proposal work, but it cannot approve, reject, reserve capacity, or call an external clinic system.

### Flow operations

Flow endpoints read observations and operational data, then calculate metrics, bottlenecks, alerts, recommendations, and simulations. Model-assisted extraction, when enabled, returns a human-review-required result; it does not assign a diagnosis or clinical priority.

## Boundaries and non-goals

- Authentication and role checks are enforced by FastAPI; the frontend is not a security boundary.
- Audit events are written by backend workflows alongside sensitive changes.
- The MCP server is a local stdio process, not an authenticated public API.
- The clinic/FHIR adapter is a mock prototype. No live HMIS or FHIR integration is implemented.
- LangGraph orchestration, Next.js, Prisma, and a separate production MCP database server are not part of the current implementation.
- Use synthetic data only. This prototype is not approved for live clinical care.
