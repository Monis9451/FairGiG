from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings

app = FastAPI(title=settings.app_name)
app.include_router(api_router, prefix="/api")


@app.get("/health")
def health_root():
    """Top-level health for orchestration (e.g. grievance-node /services/health)."""
    return {"success": True, "data": {"service": settings.app_name, "status": "ok"}, "error": None}


@app.get("/")
def root():
    return {"service": settings.app_name, "docs": "/docs"}
