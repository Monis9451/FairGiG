from __future__ import annotations

from dataclasses import dataclass
from statistics import fmean, pstdev


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
        z_score = (float(current_net) - mean_net) / std_dev
    else:
        z_score = 0.0

    if mean_net > 1e-9:
        percent_drop = ((mean_net - float(current_net)) / mean_net) * 100.0
    else:
        percent_drop = 0.0

    is_zscore_anomaly = std_dev > 1e-9 and z_score <= -abs(zscore_threshold)
    is_drop_anomaly = percent_drop >= abs(percent_drop_threshold)
    is_anomaly = is_zscore_anomaly or is_drop_anomaly

    if is_anomaly:
        explanation = (
            f"Earnings are {max(percent_drop, 0.0):.1f}% lower than verified baseline "
            f"(mean {mean_net:.2f})."
        )
    else:
        explanation = (
            f"No anomaly detected. Current net is within expected range "
            f"(z-score {z_score:.2f}, drop {percent_drop:.1f}%)."
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
