# Mzima team ownership

The repository is currently a small prototype. Ownership follows the code boundaries below; proposed future agent work is not treated as an implemented dependency.

## Backend and data

- FastAPI routes under `backend/api/v1/`
- SQLAlchemy models and Neon PostgreSQL migrations
- Queue, flow, appointment, and audit services
- Authentication, role checks, and approval-token workflow
- Mock clinic adapter and deployment configuration

## Frontend and UX

- Active React/Vite application under `src/`
- Patient appointment request flow
- Clerk, nurse, and shift-lead dashboards
- API client, session handling, and role-aware navigation

## Agent and tools

- Local stdio MCP tools under `backend/mcp/`
- Deterministic appointment slot lookup and proposal creation
- Optional bounded local appointment agent
- Safety rule: the agent cannot approve, reject, reserve capacity, or commit a booking

## Documentation and safety

- Keep architecture and setup docs aligned with the active code.
- Clearly label future HMIS/FHIR, model-hosting, and orchestration work as future work.
- Use synthetic data only and preserve the clinician approval gate.
