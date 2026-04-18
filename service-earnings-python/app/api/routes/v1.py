from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def service_status():
    """Placeholder until shift logs, CSV import, and verifier flows are implemented."""
    return {
        "success": True,
        "data": {
            "service": "earnings",
            "endpoints_planned": [
                "POST /v1/shift-logs",
                "POST /v1/shift-logs/import-csv",
                "PATCH /v1/shift-logs/{id}/verification",
            ],
        },
        "error": None,
    }
