from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health():
    return {"success": True, "data": {"service": "fairgig-anomaly", "status": "ok"}, "error": None}
