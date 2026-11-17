from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.api.deps import get_db
from backend.api.v1.router import api_router
from backend.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {"status": "healthy", "environment": settings.ENV}


@app.get("/ready", status_code=status.HTTP_200_OK)
def readiness_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        dialect = db.bind.dialect.name if db.bind is not None else "unknown"
        return {
            "status": "ready",
            "database": "connected",
            "dialect": dialect,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connectivity check failed: {exc.__class__.__name__}",
        )


@app.get("/v1/models")
def compatibility_models():
    return {
        "object": "list",
        "data": [
            {
                "id": settings.AGENTROUTER_MODEL,
                "object": "model",
                "owned_by": "agentrouter",
            }
        ],
    }