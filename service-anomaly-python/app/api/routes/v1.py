from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import settings
from app.models.anomaly import AnalyzeRequest, AnalyzeResponse, ShiftSample
from app.services.anomaly_engine import analyze_shift_nets
from app.services.auth import AuthContext, get_auth_context
from app.services.supabase_client import get_supabase_client

router = APIRouter()


def _envelope(data):
    return {"success": True, "data": data, "error": None}


def _history_nets(history: list[ShiftSample]) -> list[float]:
    return [float(shift.net_received or 0.0) for shift in history]


def _load_verified_history_from_db(
    worker_id: str,
    platform: str | None,
    current_date,
    history_days: int,
    history_limit: int,
) -> list[ShiftSample]:
    supabase = get_supabase_client()

    since_date = (current_date - timedelta(days=history_days)).isoformat()

    query = (
        supabase.table("earnings")
        .select("date, platform, gross_earned, deductions, net_received")
        .eq("worker_id", worker_id)
        .eq("status", "verified")
        .gte("date", since_date)
        .lt("date", current_date.isoformat())
        .order("date", desc=True)
        .limit(history_limit)
    )

    if platform:
        query = query.eq("platform", platform)

    response = query.execute()
    rows = response.data or []

    history: list[ShiftSample] = []
    for row in rows:
        try:
            history.append(
                ShiftSample(
                    date=row.get("date"),
                    platform=row.get("platform"),
                    gross_earned=row.get("gross_earned"),
                    deductions=row.get("deductions"),
                    net_received=row.get("net_received"),
                )
            )
        except Exception:
            continue

    return history


@router.get("/status")
def service_status():
    return _envelope(
        {
            "service": "anomaly",
            "implemented_endpoints": [
                "GET /v1/status",
                "POST /v1/analyze",
            ],
            "notes": [
                "Analyze endpoint is JWT protected",
                "Z-score + percent-drop logic with verified history",
            ],
        }
    )


@router.post(
    "/analyze",
    summary="Analyze current shift for anomaly",
    description=(
        "Protected endpoint. Accepts current shift plus optional history payload. "
        "If history is omitted, verified history is loaded from Supabase earnings table."
    ),
)
def analyze(
    payload: AnalyzeRequest,
    auth: AuthContext = Depends(get_auth_context),
):
    """Detect unusually low earnings using z-score with a percent-drop guardrail."""
    worker_id = str(payload.worker_id or auth.user_id)

    if auth.role == "worker" and worker_id != str(auth.user_id):
        raise HTTPException(
            status_code=403,
            detail="Workers can only analyze their own data",
        )

    target_platform = payload.platform or payload.current_shift.platform

    history: list[ShiftSample] = payload.history or []
    history_source = "payload_history"

    if len(history) == 0:
        history_source = "supabase_verified_history"
        history = _load_verified_history_from_db(
            worker_id=worker_id,
            platform=target_platform,
            current_date=payload.current_shift.date,
            history_days=payload.history_days or settings.anomaly_history_days,
            history_limit=payload.history_limit or settings.anomaly_history_limit,
        )

    min_history_points = settings.anomaly_min_history_points
    if len(history) < min_history_points:
        raise HTTPException(
            status_code=422,
            detail=(
                f"At least {min_history_points} history records are required "
                f"for analysis; got {len(history)}"
            ),
        )

    result = analyze_shift_nets(
        current_net=float(payload.current_shift.net_received or 0.0),
        history_nets=_history_nets(history),
        zscore_threshold=settings.anomaly_zscore_threshold,
        percent_drop_threshold=settings.anomaly_percent_drop_threshold,
    )

    response = AnalyzeResponse(
        is_anomaly=result.is_anomaly,
        explanation=result.explanation,
        method=result.method,
        data_source=history_source,
        worker_id=worker_id,
        platform=target_platform,
        current_net_received=result.current_net,
        history_count=result.history_count,
        history_mean_net_received=result.mean_net,
        history_std_dev=result.std_dev,
        z_score=result.z_score,
        percent_drop=result.percent_drop,
        thresholds={
            "z_score": settings.anomaly_zscore_threshold,
            "percent_drop": settings.anomaly_percent_drop_threshold,
        },
    )

    return _envelope(response.model_dump())
