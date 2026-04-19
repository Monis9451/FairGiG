from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.config import settings
from app.models.anomaly import (
    AnalyzeRequest,
    AnalyzeResponse,
    AnomalyRunListResponse,
    AnomalyRunRow,
    DeductionSignalView,
    ShiftSample,
)
from app.services.anomaly_engine import CombinedAnomalyResult, analyze_combined
from app.services.auth import AuthContext, get_auth_context
from app.services.supabase_client import get_supabase_client

router = APIRouter()


def _envelope(data: dict[str, Any]) -> dict[str, Any]:
    return {"success": True, "data": data, "error": None}


def _as_date(value: Any) -> date:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        return date.fromisoformat(value[:10])
    raise ValueError("invalid date value")


def _normalize_platform_name(value: Any) -> str:
    """Canonical platform label; matches frontend `normalizePlatformName`."""
    key = str(value or "").strip().lower().replace(" ", "")
    if key == "uber":
        return "Uber"
    if key == "foodpanda":
        return "FoodPanda"
    if key == "bykea":
        return "Bykea"
    if key == "indrive":
        return "inDrive"
    if key == "careem":
        return "Careem"
    return str(value or "").strip()


def _load_verified_history_from_db(
    worker_id: str,
    platform: str | None,
    current_date: date,
    history_days: int,
    history_limit: int,
) -> list[ShiftSample]:
    supabase = get_supabase_client()

    since_date = (current_date - timedelta(days=history_days)).isoformat()

    platform_filter = (platform or "").strip()
    fetch_limit = history_limit
    if platform_filter:
        fetch_limit = min(max(history_limit * 6, 180), 600)

    query = (
        supabase.table("earnings")
        .select("date, platform, gross_earned, deductions, net_received")
        .eq("worker_id", worker_id)
        .eq("status", "verified")
        .gte("date", since_date)
        .lt("date", current_date.isoformat())
        .order("date", desc=True)
        .limit(fetch_limit)
    )

    response = query.execute()
    rows = response.data or []

    target_norm = _normalize_platform_name(platform_filter) if platform_filter else ""

    history: list[ShiftSample] = []
    for row in rows:
        if platform_filter and _normalize_platform_name(row.get("platform")) != target_norm:
            continue
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
        if len(history) >= history_limit:
            break

    return history


def _validate_shift_log_belongs(
    *,
    shift_log_id: UUID,
    worker_id: str,
    current_shift: ShiftSample,
) -> None:
    supabase = get_supabase_client()
    res = (
        supabase.table("earnings")
        .select("id, worker_id, date, platform")
        .eq("id", str(shift_log_id))
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="shift_log_id not found")

    row = rows[0]
    if str(row.get("worker_id") or "") != worker_id:
        raise HTTPException(
            status_code=400,
            detail="shift_log_id does not belong to the target worker_id",
        )

    row_date = _as_date(row.get("date"))
    if row_date != current_shift.date:
        raise HTTPException(
            status_code=400,
            detail="current_shift.date must match the earnings row date when shift_log_id is set",
        )

    row_platform = row.get("platform")
    if (
        current_shift.platform
        and row_platform
        and str(row_platform).strip() != str(current_shift.platform).strip()
    ):
        raise HTTPException(
            status_code=400,
            detail="current_shift.platform must match the earnings row when shift_log_id is set",
        )


def _thresholds_dict() -> dict[str, float]:
    return {
        "net_z_score": settings.anomaly_zscore_threshold,
        "net_percent_drop": settings.anomaly_percent_drop_threshold,
        "deduction_z_score": settings.anomaly_deduction_zscore_threshold,
        "min_history_points": float(settings.anomaly_min_history_points),
    }


def _persist_run(row: dict[str, Any]) -> tuple[UUID | None, str | None]:
    try:
        supabase = get_supabase_client()
        res = supabase.table("anomaly_runs").insert(row).execute()
        data = res.data or []
        if not data:
            return None, "insert returned no rows"
        rid = data[0].get("id")
        if not rid:
            return None, "insert missing id"
        return UUID(str(rid)), None
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


def _build_persist_row(
    *,
    worker_id: str,
    shift_log_id: UUID | None,
    auth: AuthContext,
    target_platform: str | None,
    current_shift: ShiftSample,
    history_source: str,
    ready: bool,
    insufficient_reason: str | None,
    combined: CombinedAnomalyResult | None,
    response: AnalyzeResponse,
) -> dict[str, Any]:
    row: dict[str, Any] = {
        "worker_id": worker_id,
        "shift_log_id": str(shift_log_id) if shift_log_id else None,
        "triggered_by_user_id": str(auth.user_id),
        "triggered_by_role": auth.role,
        "platform": target_platform,
        "current_shift_date": current_shift.date.isoformat(),
        "ready": ready,
        "insufficient_reason": insufficient_reason,
        "data_source": history_source,
        "history_count": response.history_count,
        "thresholds": _thresholds_dict(),
    }

    if not ready:
        row["is_anomaly"] = None
        row["explanation"] = insufficient_reason
        row["method"] = None
        row["detail"] = {"reason": "insufficient_history", "history_count": response.history_count}
        return row

    assert combined is not None
    row["is_anomaly"] = combined.is_anomaly
    row["explanation"] = combined.explanation
    row["method"] = combined.method
    row["net_z_score"] = combined.net.z_score
    row["percent_drop"] = combined.net.percent_drop
    row["is_net_anomaly"] = combined.net.is_anomaly
    row["deduction_share_z_score"] = combined.deduction.z_score if combined.deduction.evaluated else None
    row["current_deduction_ratio"] = combined.deduction.current_ratio
    row["mean_deduction_ratio"] = combined.deduction.mean_ratio
    row["is_deduction_anomaly"] = combined.deduction.is_anomaly if combined.deduction.evaluated else None
    row["detail"] = {
        "net": {
            "mean_net": combined.net.mean_net,
            "std_dev": combined.net.std_dev,
            "current_net": combined.net.current_net,
        },
        "deduction": {
            "evaluated": combined.deduction.evaluated,
            "baseline_points": combined.deduction.baseline_points,
            "std_ratio": combined.deduction.std_ratio,
        },
    }
    return row


@router.get("/status")
def service_status():
    return _envelope(
        {
            "service": "anomaly",
            "implemented_endpoints": [
                "GET /v1/status",
                "POST /v1/analyze",
                "GET /v1/runs",
            ],
            "notes": [
                "Analyze: JWT required; net + deduction-share vs verified history",
                "Insufficient history returns ready=false by default (strict_history for 422)",
                "Runs are persisted to anomaly_runs when Supabase is configured",
            ],
        }
    )


@router.post(
    "/analyze",
    summary="Analyze current shift for anomaly",
    description=(
        "Protected endpoint. Accepts current shift plus optional history payload. "
        "If history is omitted, verified history is loaded from Supabase earnings table. "
        "Default: insufficient verified history yields HTTP 200 with ready=false; "
        "set strict_history=true for HTTP 422 instead."
    ),
)
def analyze(
    payload: AnalyzeRequest,
    auth: AuthContext = Depends(get_auth_context),
):
    worker_id = str(payload.worker_id or auth.user_id)

    if auth.role == "worker" and worker_id != str(auth.user_id):
        raise HTTPException(
            status_code=403,
            detail="Workers can only analyze their own data",
        )

    if payload.shift_log_id is not None:
        _validate_shift_log_belongs(
            shift_log_id=payload.shift_log_id,
            worker_id=worker_id,
            current_shift=payload.current_shift,
        )

    result_platform = payload.current_shift.platform
    # When clients omit `platform`, still scope history to the same platform as the shift
    # so baselines are not diluted by other apps' earnings.
    history_platform_filter = payload.platform or payload.current_shift.platform

    history: list[ShiftSample] = payload.history or []
    history_source = "payload_history"

    if len(history) == 0:
        history_source = "supabase_verified_history"
        history = _load_verified_history_from_db(
            worker_id=worker_id,
            platform=history_platform_filter,
            current_date=payload.current_shift.date,
            history_days=payload.history_days or settings.anomaly_history_days,
            history_limit=payload.history_limit or settings.anomaly_history_limit,
        )

    min_history_points = settings.anomaly_min_history_points
    if len(history) < min_history_points:
        if payload.strict_history:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"At least {min_history_points} history records are required "
                    f"for analysis; got {len(history)}"
                ),
            )

        insufficient = (
            f"At least {min_history_points} verified history points are required; got {len(history)}."
        )
        response = AnalyzeResponse(
            ready=False,
            insufficient_reason=insufficient,
            worker_id=UUID(worker_id),
            platform=result_platform,
            current_shift_date=payload.current_shift.date,
            shift_log_id=payload.shift_log_id,
            history_count=len(history),
            thresholds=_thresholds_dict(),
        )
        row = _build_persist_row(
            worker_id=worker_id,
            shift_log_id=payload.shift_log_id,
            auth=auth,
            target_platform=result_platform,
            current_shift=payload.current_shift,
            history_source=history_source,
            ready=False,
            insufficient_reason=insufficient,
            combined=None,
            response=response,
        )
        run_id, perr = _persist_run(row)
        response.run_id = run_id
        response.persist_warning = perr
        return _envelope(response.model_dump(mode="json"))

    combined = analyze_combined(
        payload.current_shift,
        history,
        net_zscore_threshold=settings.anomaly_zscore_threshold,
        net_percent_drop_threshold=settings.anomaly_percent_drop_threshold,
        deduction_zscore_threshold=settings.anomaly_deduction_zscore_threshold,
    )

    d = combined.deduction
    deduction_view = DeductionSignalView(
        evaluated=d.evaluated,
        is_anomaly=d.is_anomaly,
        explanation=d.explanation,
        current_deduction_ratio=d.current_ratio,
        mean_deduction_ratio=d.mean_ratio,
        z_score=d.z_score,
        baseline_points=d.baseline_points,
    )

    response = AnalyzeResponse(
        ready=True,
        insufficient_reason=None,
        is_anomaly=combined.is_anomaly,
        explanation=combined.explanation,
        method=combined.method,
        data_source=history_source,
        worker_id=UUID(worker_id),
        platform=result_platform,
        current_shift_date=payload.current_shift.date,
        shift_log_id=payload.shift_log_id,
        current_net_received=combined.net.current_net,
        history_count=combined.history_count,
        history_mean_net_received=combined.net.mean_net,
        history_std_dev=combined.net.std_dev,
        z_score=combined.net.z_score,
        percent_drop=combined.net.percent_drop,
        is_net_anomaly=combined.net.is_anomaly,
        deduction_signal=deduction_view,
        thresholds=_thresholds_dict(),
    )

    row = _build_persist_row(
        worker_id=worker_id,
        shift_log_id=payload.shift_log_id,
        auth=auth,
        target_platform=result_platform,
        current_shift=payload.current_shift,
        history_source=history_source,
        ready=True,
        insufficient_reason=None,
        combined=combined,
        response=response,
    )
    run_id, perr = _persist_run(row)
    response.run_id = run_id
    response.persist_warning = perr

    return _envelope(response.model_dump(mode="json"))


@router.get("/runs", summary="List persisted anomaly runs (audit trail)")
def list_runs(
    auth: AuthContext = Depends(get_auth_context),
    worker_id: UUID | None = Query(
        default=None,
        description="Filter by worker; required for staff when scoping; ignored for workers (always self).",
    ),
    limit: int = Query(default=25, ge=1),
    offset: int = Query(default=0, ge=0),
):
    cap = min(settings.anomaly_list_runs_max_limit, 100)
    limit = min(limit, cap)

    target_worker: str | None
    if auth.role == "worker":
        if worker_id is not None and worker_id != auth.user_id:
            raise HTTPException(status_code=403, detail="Workers can only list their own runs")
        target_worker = str(auth.user_id)
    else:
        target_worker = str(worker_id) if worker_id is not None else None

    supabase = get_supabase_client()
    query = supabase.table("anomaly_runs").select("*")
    if target_worker is not None:
        query = query.eq("worker_id", target_worker)

    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
    res = query.execute()
    rows = res.data or []

    items = [AnomalyRunRow.model_validate(r) for r in rows]

    return _envelope(
        AnomalyRunListResponse(items=items, limit=limit, offset=offset).model_dump(mode="json")
    )
