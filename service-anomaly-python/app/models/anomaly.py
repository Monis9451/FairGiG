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
    platform: str | None = Field(default=None, max_length=80)
    history_days: int | None = Field(default=None, ge=7, le=365)
    history_limit: int | None = Field(default=None, ge=10, le=1000)

    @model_validator(mode="after")
    def validate_history(self) -> AnalyzeRequest:
        if self.history is not None and len(self.history) == 0:
            raise ValueError("history must contain at least one record when provided")
        return self


class AnalyzeResponse(BaseModel):
    is_anomaly: bool
    explanation: str
    method: str
    data_source: str
    worker_id: UUID
    platform: str | None
    current_net_received: float
    history_count: int
    history_mean_net_received: float
    history_std_dev: float
    z_score: float
    percent_drop: float
    thresholds: dict[str, float]
