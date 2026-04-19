from __future__ import annotations

import csv
from datetime import date
from io import StringIO
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from app.models.earnings import (
    CsvImportSummary,
    EarningStatus,
    ShiftLogCreateRequest,
    ShiftLogListQuery,
    ShiftLogPayload,
    ShiftLogVerificationRequest,
)
from app.services.auth import AuthContext, get_auth_context, require_role
from app.services.supabase_client import get_supabase_client

router = APIRouter()


def _envelope(data):
    return {"success": True, "data": data, "error": None}


def _parse_csv_file(content: bytes) -> list[dict[str, str]]:
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded") from exc

    reader = csv.DictReader(StringIO(text))
    rows = list(reader)

    required_columns = {"platform", "date", "hours_worked", "gross_earned", "deductions"}
    headers = set(reader.fieldnames or [])

    missing = sorted(required_columns - headers)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"CSV missing required columns: {', '.join(missing)}",
        )

    if len(rows) < 10:
        raise HTTPException(
            status_code=400,
            detail="CSV import requires at least 10 rows",
        )

    return rows


def _to_db_payload(worker_id: str, payload: ShiftLogPayload) -> dict:
    return {
        "worker_id": worker_id,
        "platform": payload.platform,
        "date": payload.date.isoformat(),
        "hours_worked": payload.hours_worked,
        "gross_earned": payload.gross_earned,
        "deductions": payload.deductions,
        "net_received": payload.net_received,
        "screenshot_url": payload.screenshot_url,
        "status": "pending",
        "anomaly_explanation": None,
    }


def _enrich_shift_logs_worker_profiles(supabase, items: list[dict]) -> list[dict]:
    """Attach worker_full_name from public.profiles (id = worker_id)."""
    if not items:
        return items
    ids = list({str(row.get("worker_id")) for row in items if row.get("worker_id")})
    if not ids:
        return items
    prof = supabase.table("profiles").select("id, full_name").in_("id", ids).execute()
    by_id: dict[str, str | None] = {}
    for r in prof.data or []:
        name = (r.get("full_name") or "").strip()
        by_id[str(r["id"])] = name or None
    return [{**row, "worker_full_name": by_id.get(str(row.get("worker_id") or ""))} for row in items]


def _apply_shift_log_filters(q, auth: AuthContext, list_query: ShiftLogListQuery):
    if auth.role == "worker":
        q = q.eq("worker_id", str(auth.user_id))
    elif list_query.worker_id is not None:
        q = q.eq("worker_id", str(list_query.worker_id))

    if list_query.status is not None:
        q = q.eq("status", list_query.status.value)

    if list_query.platform:
        q = q.eq("platform", list_query.platform)

    if list_query.from_date:
        q = q.gte("date", list_query.from_date.isoformat())

    if list_query.to_date:
        q = q.lte("date", list_query.to_date.isoformat())

    return q


@router.get("/status")
def service_status():
    return _envelope(
        {
            "service": "earnings",
            "implemented_endpoints": [
                "GET /v1/status",
                "GET /v1/shift-logs",
                "GET /v1/shift-logs/{id}",
                "POST /v1/shift-logs",
                "POST /v1/shift-logs/import-csv",
                "PATCH /v1/shift-logs/{id}/verification",
                "GET /v1/shift-logs/status-counts",
            ],
            "notes": [
                "JWT auth enforced for earnings mutations",
                "Per-shift anomaly analysis lives in service-anomaly-python; earnings stores verifier anomaly_explanation on flag",
            ],
        }
    )


@router.get("/shift-logs")
def list_shift_logs(
    auth: AuthContext = Depends(get_auth_context),
    worker_id: Annotated[UUID | None, Query()] = None,
    status: Annotated[EarningStatus | None, Query()] = None,
    platform: Annotated[str | None, Query(max_length=80)] = None,
    from_date: Annotated[date | None, Query(alias="from")] = None,
    to_date: Annotated[date | None, Query(alias="to")] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0, le=5000)] = 0,
):
    query = ShiftLogListQuery(
        worker_id=worker_id,
        status=status,
        platform=platform,
        from_date=from_date,
        to_date=to_date,
        limit=limit,
        offset=offset,
    )

    supabase = get_supabase_client()
    row_select = (
        "id, worker_id, platform, date, hours_worked, gross_earned, deductions, net_received, "
        "screenshot_url, status, anomaly_explanation, created_at"
    )
    db_query = _apply_shift_log_filters(
        supabase.table("earnings").select(row_select),
        auth,
        query,
    ).order("date", desc=True).range(query.offset, query.offset + query.limit - 1)

    response = db_query.execute()
    items = response.data or []

    count_query = _apply_shift_log_filters(
        supabase.table("earnings").select("id", count="exact"),
        auth,
        query,
    )
    count_response = count_query.execute()
    total = getattr(count_response, "count", None)
    if total is None:
        total = len(items)

    items = _enrich_shift_logs_worker_profiles(supabase, items)

    return _envelope(
        {
            "items": items,
            "pagination": {
                "limit": query.limit,
                "offset": query.offset,
                "count": len(items),
                "total": total,
            },
        }
    )


@router.get("/shift-logs/status-counts")
def shift_log_status_counts(
    _auth: AuthContext = Depends(require_role("verifier", "advocate", "analyst")),
):
    """Full-table counts per status (staff only)."""
    supabase = get_supabase_client()
    by_status: dict[str, int] = {}
    for st in EarningStatus:
        count_response = (
            supabase.table("earnings")
            .select("id", count="exact")
            .eq("status", st.value)
            .execute()
        )
        by_status[st.value] = int(getattr(count_response, "count", None) or 0)

    return _envelope({"by_status": by_status})


@router.get("/shift-logs/{shift_log_id}")
def get_shift_log(shift_log_id: UUID, auth: AuthContext = Depends(get_auth_context)):
    supabase = get_supabase_client()
    response = (
        supabase.table("earnings")
        .select(
            "id, worker_id, platform, date, hours_worked, gross_earned, deductions, net_received, screenshot_url, status, anomaly_explanation, created_at"
        )
        .eq("id", str(shift_log_id))
        .limit(1)
        .execute()
    )

    rows = response.data or []
    if len(rows) == 0:
        raise HTTPException(status_code=404, detail="Shift log not found")

    item = rows[0]
    if auth.role == "worker" and item.get("worker_id") != str(auth.user_id):
        raise HTTPException(status_code=403, detail="Workers can only view their own logs")

    enriched = _enrich_shift_logs_worker_profiles(supabase, [item])[0]
    return _envelope({"shift_log": enriched})


@router.post("/shift-logs")
def create_shift_log(
    payload: ShiftLogCreateRequest,
    auth: AuthContext = Depends(require_role("worker")),
):
    worker_id = str(auth.user_id)

    if payload.worker_id is not None and str(payload.worker_id) != worker_id:
        raise HTTPException(
            status_code=403,
            detail="worker_id in payload must match authenticated user",
        )

    screenshot_url = str(payload.screenshot_url or "").strip()
    if not screenshot_url:
        raise HTTPException(
            status_code=422,
            detail="screenshot_url is required when logging a shift",
        )

    payload.screenshot_url = screenshot_url

    supabase = get_supabase_client()

    insert_response = (
        supabase.table("earnings")
        .insert(_to_db_payload(worker_id=worker_id, payload=payload))
        .execute()
    )

    rows = insert_response.data or []
    if len(rows) == 0:
        raise HTTPException(status_code=500, detail="Failed to create shift log")

    enriched = _enrich_shift_logs_worker_profiles(supabase, [rows[0]])[0]
    return _envelope({"shift_log": enriched})


@router.post("/shift-logs/import-csv")
async def import_shift_logs_csv(
    file: UploadFile = File(...),
    auth: AuthContext = Depends(require_role("worker")),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    content = await file.read()
    csv_rows = _parse_csv_file(content)

    worker_id = str(auth.user_id)
    prepared_rows: list[dict] = []
    errors: list[dict] = []

    for row_index, row in enumerate(csv_rows, start=2):
        try:
            row_worker_id = (row.get("worker_id") or "").strip()
            if row_worker_id and row_worker_id != worker_id:
                raise ValueError("worker_id does not match authenticated user")

            payload = ShiftLogCreateRequest(
                platform=(row.get("platform") or "").strip(),
                date=(row.get("date") or "").strip(),
                hours_worked=row.get("hours_worked"),
                gross_earned=row.get("gross_earned"),
                deductions=row.get("deductions"),
                net_received=row.get("net_received"),
                screenshot_url=(row.get("screenshot_url") or "").strip() or None,
            )
            prepared_rows.append(_to_db_payload(worker_id=worker_id, payload=payload))
        except Exception as exc:  # noqa: BLE001
            errors.append({"row": row_index, "error": str(exc)})

    summary = CsvImportSummary(
        total_rows=len(csv_rows),
        inserted_rows=0,
        skipped_rows=len(errors),
        errors=errors,
    )

    if errors:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "CSV validation failed. No rows were inserted.",
                **summary.model_dump(),
            },
        )

    supabase = get_supabase_client()
    insert_response = supabase.table("earnings").insert(prepared_rows).execute()
    inserted = len(insert_response.data or [])

    return _envelope(
        CsvImportSummary(
            total_rows=len(csv_rows),
            inserted_rows=inserted,
            skipped_rows=0,
            errors=[],
        ).model_dump()
    )


@router.patch("/shift-logs/{shift_log_id}/verification")
def update_shift_log_verification(
    shift_log_id: UUID,
    payload: ShiftLogVerificationRequest,
    _auth: AuthContext = Depends(require_role("verifier")),
):
    supabase = get_supabase_client()

    existing_response = (
        supabase.table("earnings")
        .select("id, status")
        .eq("id", str(shift_log_id))
        .limit(1)
        .execute()
    )
    rows = existing_response.data or []

    if len(rows) == 0:
        raise HTTPException(status_code=404, detail="Shift log not found")

    current_status = rows[0].get("status")
    if current_status != EarningStatus.pending.value:
        raise HTTPException(
            status_code=409,
            detail="Only pending logs can be verified, flagged, or marked unverifiable",
        )

    update_payload = {
        "status": payload.status.value,
        "anomaly_explanation": payload.anomaly_explanation,
    }

    updated_response = (
        supabase.table("earnings")
        .update(update_payload)
        .eq("id", str(shift_log_id))
        .execute()
    )

    updated_rows = updated_response.data or []
    if len(updated_rows) == 0:
        raise HTTPException(status_code=500, detail="Failed to update verification status")

    enriched = _enrich_shift_logs_worker_profiles(supabase, [updated_rows[0]])[0]
    return _envelope({"shift_log": enriched})
