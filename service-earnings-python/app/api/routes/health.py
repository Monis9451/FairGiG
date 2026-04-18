from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health():
    return {"success": True, "data": {"service": "fairgig-earnings", "status": "ok"}, "error": None}
