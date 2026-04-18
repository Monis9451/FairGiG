from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def service_status():
    """Placeholder until /analyze (Isolation Forest or z-score) is implemented."""
    return {
        "success": True,
        "data": {
            "service": "anomaly",
            "endpoints_planned": ["POST /v1/analyze"],
        },
        "error": None,
    }
