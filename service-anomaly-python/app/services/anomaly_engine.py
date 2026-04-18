from __future__ import annotations

from dataclasses import dataclass
from statistics import fmean, pstdev

from app.models.anomaly import ShiftSample


@dataclass(slots=True)
class AnomalyResult:
    is_anomaly: bool
    explanation: str
    method: str
    current_net: float
    mean_net: float
    std_dev: float
    z_score: float
    percent_drop: float
    history_count: int


@dataclass(slots=True)
class DeductionSignal:
    """Platform commission / deductions as a share of gross (unusually high vs own history)."""

    evaluated: bool
    is_anomaly: bool
    explanation: str
    current_ratio: float | None
    mean_ratio: float | None
    std_ratio: float
    z_score: float
    baseline_points: int


@dataclass(slots=True)
class CombinedAnomalyResult:
    is_anomaly: bool
    explanation: str
    method: str
    net: AnomalyResult
    deduction: DeductionSignal
    history_count: int


def analyze_shift_nets(
    current_net: float,
    history_nets: list[float],
    *,
    zscore_threshold: float,
    percent_drop_threshold: float,
) -> AnomalyResult:
    if len(history_nets) == 0:
        raise ValueError("history_nets must not be empty")

    mean_net = float(fmean(history_nets))
    std_dev = float(pstdev(history_nets)) if len(history_nets) > 1 else 0.0

    if std_dev > 1e-9:
        raw_z_score = (float(current_net) - mean_net) / std_dev
    else:
        raw_z_score = 0.0

    # For worker-protection use-cases, we treat only downside deviation as risk.
    z_score = raw_z_score if raw_z_score < 0.0 else 0.0

    if mean_net > 1e-9:
        raw_percent_drop = ((mean_net - float(current_net)) / mean_net) * 100.0
        percent_drop = max(raw_percent_drop, 0.0)
    else:
        percent_drop = 0.0

    is_zscore_anomaly = std_dev > 1e-9 and z_score <= -abs(zscore_threshold)
    is_drop_anomaly = percent_drop >= abs(percent_drop_threshold)
    is_anomaly = is_zscore_anomaly or is_drop_anomaly

    if is_anomaly:
        explanation = (
            f"Possible pay drop detected. This shift is {percent_drop:.1f}% lower than "
            "your usual verified earnings."
        )
    else:
        if percent_drop <= 1e-9:
            explanation = "No pay-drop anomaly. This shift is not lower than your usual verified earnings."
        else:
            explanation = (
                f"No pay-drop anomaly. This shift is {percent_drop:.1f}% lower than usual, "
                "but still below the alert threshold."
            )

    return AnomalyResult(
        is_anomaly=is_anomaly,
        explanation=explanation,
        method="z-score + percent-drop guardrail",
        current_net=round(float(current_net), 2),
        mean_net=round(mean_net, 2),
        std_dev=round(std_dev, 4),
        z_score=round(z_score, 4),
        percent_drop=round(percent_drop, 2),
        history_count=len(history_nets),
    )


def _deduction_ratios(samples: list[ShiftSample]) -> list[float]:
    ratios: list[float] = []
    for s in samples:
        g = float(s.gross_earned or 0.0)
        if g > 1e-9:
            ratios.append(float(s.deductions or 0.0) / g)
    return ratios


def analyze_deduction_share(
    current: ShiftSample,
    history: list[ShiftSample],
    *,
    zscore_threshold: float,
) -> DeductionSignal:
    """
    Flags unusually high deduction share (deductions/gross) vs the worker's verified history.
    Skips when current gross is zero or when the baseline has too few positive-gross points.
    """
    history_ratios = _deduction_ratios(history)
    gross = float(current.gross_earned or 0.0)

    if gross <= 1e-9:
        return DeductionSignal(
            evaluated=False,
            is_anomaly=False,
            explanation="Deduction share not evaluated (current gross is zero).",
            current_ratio=None,
            mean_ratio=None,
            std_ratio=0.0,
            z_score=0.0,
            baseline_points=len(history_ratios),
        )

    current_ratio = float(current.deductions or 0.0) / gross
    current_ratio = round(max(0.0, min(current_ratio, 1.0)), 6)

    if len(history_ratios) < 2:
        return DeductionSignal(
            evaluated=False,
            is_anomaly=False,
            explanation=(
                "Deduction share baseline needs at least two verified shifts with positive gross."
            ),
            current_ratio=current_ratio,
            mean_ratio=float(fmean(history_ratios)) if history_ratios else None,
            std_ratio=0.0,
            z_score=0.0,
            baseline_points=len(history_ratios),
        )

    mean_r = float(fmean(history_ratios))
    std_r = float(pstdev(history_ratios)) if len(history_ratios) > 1 else 0.0

    if std_r <= 1e-9:
        is_anomaly = current_ratio > mean_r + 1e-9
        z_score = 0.0
    else:
        z_score = (current_ratio - mean_r) / std_r
        is_anomaly = z_score >= abs(zscore_threshold)

    if is_anomaly:
        expl = (
            f"Deduction share {current_ratio * 100:.1f}% is high vs your verified baseline "
            f"(mean {mean_r * 100:.1f}%, z-score {z_score:.2f})."
        )
    else:
        expl = (
            f"Deduction share looks typical (current {current_ratio * 100:.1f}% vs "
            f"baseline mean {mean_r * 100:.1f}%, z-score {z_score:.2f})."
        )

    return DeductionSignal(
        evaluated=True,
        is_anomaly=is_anomaly,
        explanation=expl,
        current_ratio=current_ratio,
        mean_ratio=round(mean_r, 6),
        std_ratio=round(std_r, 6),
        z_score=round(z_score, 4),
        baseline_points=len(history_ratios),
    )


def analyze_combined(
    current: ShiftSample,
    history: list[ShiftSample],
    *,
    net_zscore_threshold: float,
    net_percent_drop_threshold: float,
    deduction_zscore_threshold: float,
) -> CombinedAnomalyResult:
    """
    Net-income anomaly (existing) plus deduction-share anomaly vs the same history window.
    """
    history_nets = [float(s.net_received or 0.0) for s in history]
    net = analyze_shift_nets(
        float(current.net_received or 0.0),
        history_nets,
        zscore_threshold=net_zscore_threshold,
        percent_drop_threshold=net_percent_drop_threshold,
    )
    deduction = analyze_deduction_share(
        current,
        history,
        zscore_threshold=deduction_zscore_threshold,
    )

    is_anomaly = net.is_anomaly or deduction.is_anomaly
    parts = [net.explanation]
    if deduction.evaluated:
        parts.append(deduction.explanation)
    elif deduction.current_ratio is not None:
        parts.append(deduction.explanation)

    explanation = " ".join(parts)

    return CombinedAnomalyResult(
        is_anomaly=is_anomaly,
        explanation=explanation,
        method="net z-score + percent-drop; deduction-share z-score",
        net=net,
        deduction=deduction,
        history_count=len(history),
    )
