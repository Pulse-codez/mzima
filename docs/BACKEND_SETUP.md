# Mzima Backend Setup

The authoritative Python package is `backend/`. Run commands from the repository root; `backend/pyproject.toml`, `backend/uv.lock`, and the root `alembic.ini` are the package, dependency, and migration configurations.

## Prerequisites

- Python 3.11 or newer
- [uv](https://docs.astral.sh/uv/)
- Neon PostgreSQL for local, shared, and deployed environments

## First-time setup

```bash
uv sync --project backend --extra dev
cp .env.example .env
```

Set private `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `SECRET_KEY` values. Use the pooled Neon connection in `DATABASE_URL` for API traffic and the direct connection in `DATABASE_URL_UNPOOLED` for migrations. Never commit credentials.

## Migrations and server

```bash
uv run --project backend alembic -c alembic.ini upgrade head
uv run --project backend uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

The API docs are at `http://127.0.0.1:8000/docs`; health and readiness endpoints are `/health` and `/ready`.

## Tests and synthetic data

```bash
TEST_DATABASE_URL=<isolated-postgres-url> uv run --project backend pytest -v
TEST_DATABASE_URL=<isolated-postgres-url> uv run --project backend python -m scripts.test_phase5
TEST_DATABASE_URL=<isolated-postgres-url> uv run --project backend python -m scripts.test_phase6
```

The pytest suite and phase scripts require `TEST_DATABASE_URL`, pointing to an isolated Neon/PostgreSQL database. Seed or import synthetic application data only when intentionally targeting a configured development database:

```bash
uv run --project backend python -m scripts.seed_data
uv run --project backend python -m scripts.seed_flow
uv run --project backend python -m scripts.import_synthea
```

## Optional local appointment agent and MCP

The local appointment agent is disabled by default. Configure `LOCAL_AGENT_ENABLED=true`, a loopback-only `LOCAL_MODEL_BASE_URL`, `LOCAL_MODEL_NAME`, and `LOCAL_MODEL_API_KEY` to enable it. The model may only call slot lookup and proposal tools. Clinician approval remains an authenticated API action. The FastMCP server is local stdio, not an authenticated network endpoint; operational tools fail closed unless an authenticated embedding host supplies an active `SHIFT_LEAD`/`ADMIN` actor ID. Use `POST /api/v1/flow/operational-query` for the authenticated operational query workflow.

AgentRouter extraction is separately configured through `AGENTROUTER_API_KEY`, `BASE_URL`/`AGENTROUTER_BASE_URL`, and `MODEL_NAME`/`AGENTROUTER_MODEL`. Extraction returns a human-review-required payload and does not diagnose or set clinical priority.

This is a synthetic-data prototype, not a live-care system. Clinical workflow changes require authorized staff decisions.
