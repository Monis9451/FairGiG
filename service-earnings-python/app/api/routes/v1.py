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
    db_query = (
        supabase.table("earnings")
        .select(
            "id, worker_id, platform, date, hours_worked, gross_earned, deductions, net_received, screenshot_url, status, anomaly_explanation, created_at"
        )
        .order("date", desc=True)
        .range(query.offset, query.offset + query.limit - 1)
    )

    if auth.role == "worker":
        db_query = db_query.eq("worker_id", str(auth.user_id))
    elif query.worker_id is not None:
        db_query = db_query.eq("worker_id", str(query.worker_id))

    if query.status is not None:
        db_query = db_query.eq("status", query.status.value)

    if query.platform:
        db_query = db_query.eq("platform", query.platform)

    if query.from_date:
        db_query = db_query.gte("date", query.from_date.isoformat())

    if query.to_date:
        db_query = db_query.lte("date", query.to_date.isoformat())

    response = db_query.execute()

    return _envelope(
        {
            "items": response.data or [],
            "pagination": {
                "limit": query.limit,
                "offset": query.offset,
                "count": len(response.data or []),
            },
        }
    )


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

    return _envelope({"shift_log": item})


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

    supabase = get_supabase_client()

    insert_response = (
        supabase.table("earnings")
        .insert(_to_db_payload(worker_id=worker_id, payload=payload))
        .execute()
    )

    rows = insert_response.data or []
    if len(rows) == 0:
        raise HTTPException(status_code=500, detail="Failed to create shift log")

    return _envelope({"shift_log": rows[0]})


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

    return _envelope({"shift_log": updated_rows[0]})
