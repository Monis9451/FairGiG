from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class ShiftSample(BaseModel):
    date: date
    platform: str | None = Field(default=None, max_length=80)
    gross_earned: float = Field(ge=0)
    deductions: float = Field(ge=0)
    net_received: float | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_money(self) -> ShiftSample:
        if self.deductions > self.gross_earned:
            raise ValueError("deductions cannot exceed gross_earned")

        expected = round(float(self.gross_earned - self.deductions) + 1e-9, 2)

        if self.net_received is None:
            self.net_received = expected
        else:
            provided = round(float(self.net_received) + 1e-9, 2)
            if abs(provided - expected) > 0.01:
                raise ValueError("net_received must equal gross_earned - deductions")
            self.net_received = provided

        self.gross_earned = round(float(self.gross_earned) + 1e-9, 2)
        self.deductions = round(float(self.deductions) + 1e-9, 2)
        return self


class AnalyzeRequest(BaseModel):
    current_shift: ShiftSample
    history: list[ShiftSample] | None = None
    worker_id: UUID | None = None
    """When set, verifiers/advocates/analysts may analyze this worker; workers may only omit or set self."""

    shift_log_id: UUID | None = Field(
        default=None,
        description="Optional earnings row id; must belong to worker_id when provided.",
    )
    platform: str | None = Field(default=None, max_length=80)
    history_days: int | None = Field(default=None, ge=7, le=365)
    history_limit: int | None = Field(default=None, ge=10, le=1000)
    strict_history: bool = Field(
        default=False,
        description="If true, return HTTP 422 when verified history is below minimum; "
        "default is 200 with ready=false.",
    )

    @model_validator(mode="after")
    def validate_history(self) -> AnalyzeRequest:
        if self.history is not None and len(self.history) == 0:
            raise ValueError("history must contain at least one record when provided")
        return self


class DeductionSignalView(BaseModel):
    evaluated: bool
    is_anomaly: bool
    explanation: str
    current_deduction_ratio: float | None = None
    mean_deduction_ratio: float | None = None
    z_score: float
    baseline_points: int


class AnalyzeResponse(BaseModel):
    """When ready is false, is_anomaly and most metrics are null (insufficient history)."""

    ready: bool
    insufficient_reason: str | None = None

    is_anomaly: bool | None = None
    explanation: str | None = None
    method: str | None = None
    data_source: str | None = None

    worker_id: UUID
    platform: str | None = None
    current_shift_date: date
    shift_log_id: UUID | None = None

    current_net_received: float | None = None
    history_count: int = 0
    history_mean_net_received: float | None = None
    history_std_dev: float | None = None
    z_score: float | None = None
    percent_drop: float | None = None
    is_net_anomaly: bool | None = None

    deduction_signal: DeductionSignalView | None = None

    thresholds: dict[str, float] | None = None
    run_id: UUID | None = Field(default=None, description="Persisted row id when audit insert succeeded.")

    persist_warning: str | None = Field(
        default=None,
        description="Set when analysis succeeded but writing anomaly_runs failed.",
    )


class AnomalyRunRow(BaseModel):
    id: UUID
    created_at: str
    worker_id: UUID
    shift_log_id: UUID | None = None
    triggered_by_user_id: UUID | None = None
    triggered_by_role: str
    platform: str | None = None
    current_shift_date: date
    ready: bool
    insufficient_reason: str | None = None
    is_anomaly: bool | None = None
    explanation: str | None = None
    method: str | None = None
    data_source: str | None = None
    net_z_score: float | None = None
    percent_drop: float | None = None
    is_net_anomaly: bool | None = None
    deduction_share_z_score: float | None = None
    current_deduction_ratio: float | None = None
    mean_deduction_ratio: float | None = None
    is_deduction_anomaly: bool | None = None
    history_count: int = 0
    thresholds: dict | None = None
    detail: dict | None = None

    model_config = {"extra": "ignore"}


class AnomalyRunListResponse(BaseModel):
    items: list[AnomalyRunRow]
    limit: int
    offset: int
