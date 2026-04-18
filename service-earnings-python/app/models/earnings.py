from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class EarningStatus(str, Enum):
    pending = "pending"
    verified = "verified"
    flagged = "flagged"
    unverifiable = "unverifiable"


class VerificationStatus(str, Enum):
    verified = "verified"
    flagged = "flagged"
    unverifiable = "unverifiable"


def _round_money(value: float) -> float:
    return round(float(value) + 1e-9, 2)


class ShiftLogPayload(BaseModel):
    platform: str = Field(min_length=1, max_length=80)
    date: date
    hours_worked: float = Field(gt=0, le=24)
    gross_earned: float = Field(ge=0)
    deductions: float = Field(ge=0)
    net_received: float | None = Field(default=None, ge=0)
    screenshot_url: str | None = Field(default=None, max_length=2048)

    @model_validator(mode="after")
    def validate_financials(self) -> ShiftLogPayload:
        if self.deductions > self.gross_earned:
            raise ValueError("deductions cannot exceed gross_earned")

        expected = _round_money(self.gross_earned - self.deductions)

        if self.net_received is None:
            self.net_received = expected
        else:
            provided = _round_money(self.net_received)
            if abs(provided - expected) > 0.01:
                raise ValueError("net_received must equal gross_earned - deductions")
            self.net_received = provided

        self.hours_worked = round(float(self.hours_worked), 2)
        self.gross_earned = _round_money(self.gross_earned)
        self.deductions = _round_money(self.deductions)
        return self


class ShiftLogCreateRequest(ShiftLogPayload):
    worker_id: UUID | None = None


class ShiftLogVerificationRequest(BaseModel):
    status: VerificationStatus
    anomaly_explanation: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def validate_flag_reason(self) -> ShiftLogVerificationRequest:
        if self.status in (VerificationStatus.flagged, VerificationStatus.unverifiable):
            explanation = (self.anomaly_explanation or "").strip()
            if not explanation:
                raise ValueError(
                    "anomaly_explanation is required when status is flagged or unverifiable"
                )
            self.anomaly_explanation = explanation
        elif self.anomaly_explanation is not None:
            self.anomaly_explanation = self.anomaly_explanation.strip() or None

        return self


class ShiftLogListQuery(BaseModel):
    worker_id: UUID | None = None
    status: EarningStatus | None = None
    platform: str | None = None
    from_date: date | None = None
    to_date: date | None = None
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0, le=5000)


class CsvImportSummary(BaseModel):
    total_rows: int
    inserted_rows: int
    skipped_rows: int
    errors: list[dict[str, Any]]
