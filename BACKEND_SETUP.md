# Mzima Backend Setup

The authoritative Python package is `backend/`. Run commands from the repository root; the root `pyproject.toml`, `uv.lock`, and `alembic.ini` are the single package, dependency, and migration configurations.

## Prerequisites

- Python 3.11 or newer
- [uv](https://docs.astral.sh/uv/)
- PostgreSQL for shared/deployed environments; SQLite is supported for local synthetic development and isolated tests

## First-time setup

```bash
uv sync --extra dev
cp .env.example .env
```

Set a private `DATABASE_URL` and `SECRET_KEY`. For local synthetic use, set `DATABASE_URL=sqlite:///./mzima.db`. Pytest fixtures use an in-memory SQLite database and do not depend on `.env`. Never commit credentials.

## Migrations and server

```bash
uv run alembic -c alembic.ini upgrade head
uv run uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

The API docs are at `http://127.0.0.1:8000/docs`; health and readiness endpoints are `/health` and `/ready`.

## Tests and synthetic data

```bash
uv run pytest -v
uv run python -m scripts.test_phase5
uv run python -m scripts.test_phase6
```

The pytest suite uses isolated in-memory SQLite fixtures. Phase scripts use temporary in-memory SQLite databases. Seed or import synthetic application data only when intentionally targeting a configured development database:

```bash
uv run python -m scripts.seed_data
uv run python -m scripts.seed_flow
uv run python -m scripts.import_synthea
```

## Optional local appointment agent and MCP

The local appointment agent is disabled by default. Configure `LOCAL_AGENT_ENABLED=true`, a loopback-only `LOCAL_MODEL_BASE_URL`, `LOCAL_MODEL_NAME`, and `LOCAL_MODEL_API_KEY` to enable it. The model may only call slot lookup and proposal tools. Clinician approval remains an authenticated API action. The FastMCP server is local stdio, not an authenticated network endpoint; operational tools fail closed unless an authenticated embedding host supplies an active `SHIFT_LEAD`/`ADMIN` actor ID. Use `POST /api/v1/flow/operational-query` for the authenticated operational query workflow.

AgentRouter extraction is separately configured through `AGENTROUTER_API_KEY`, `BASE_URL`/`AGENTROUTER_BASE_URL`, and `MODEL_NAME`/`AGENTROUTER_MODEL`. Extraction returns a human-review-required payload and does not diagnose or set clinical priority.

This is a synthetic-data prototype, not a live-care system. Clinical workflow changes require authorized staff decisions.
