from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings

app = FastAPI(title=settings.app_name)
app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {"service": settings.app_name, "docs": "/docs"}
