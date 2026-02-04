from __future__ import annotations

from dataclasses import dataclass, asdict
from time import perf_counter
from typing import Any, Dict
import json
import pandas as pd

from src.utilities.quality_control import QC_samples_and_summarize
from src.utilities.normalization import normalize_moisture
from src.utilities.risk_model import compute_risk_score
from src.utilities.forecast_extraction import get_24h_precip
from src.utilities.aws_storage import AwsStorage, ddb_row_to_raw_payload


@dataclass
class RuntimeReport:
    total_ms: float
    stages_ms: Dict[str, float]
    meta: Dict[str, Any]


class StageTimer:
    def __init__(self) -> None:
        self.stages_ms: Dict[str, float] = {}

    def time(self, name: str):
        return _StageCtx(self.stages_ms, name)


class _StageCtx:
    def __init__(self, stages: Dict[str, float], name: str) -> None:
        self.stages = stages
        self.name = name
        self.t0 = 0.0

    def __enter__(self):
        self.t0 = perf_counter()

    def __exit__(self, exc_type, exc, tb):
        self.stages[self.name] = (perf_counter() - self.t0) * 1000.0
        return False


def run_pipeline_timed(site_id: str, now_iso: str, *, region: str = "us-east-1") -> RuntimeReport:
    t_total0 = perf_counter()
    timer = StageTimer()

    with timer.time("storage_init"):
        storage = AwsStorage(region=region)

    with timer.time("get_site_config"):
        config = storage.get_site_config(site_id)

    with timer.time("get_latest_two_raw_payloads"):
        latest_row, prev_row = storage.get_latest_two_raw_payloads(site_id)

    with timer.time("ddb_row_to_raw_payload_latest"):
        raw_payload = ddb_row_to_raw_payload(latest_row)

    with timer.time("ddb_row_to_raw_payload_prev"):
        previous_raw_payload = ddb_row_to_raw_payload(prev_row)

    with timer.time("get_sat_1h_ago"):
        soil_saturation_1h_ago = storage.get_sat_1h_ago(site_id, now_iso)

    # config parsing is “runtime” too, but small. Still time it so you can show completeness.
    with timer.time("parse_config"):
        lat = float(config["lat"])
        lon = float(config["lon"])
        fc_vwc = float(config["fc_vwc"])
        sat_vwc = float(config["sat_vwc"])
        idf_24h_mm = float(config["idf_24h_2yr_mm"])

    with timer.time("parse_timestamp"):
        timestamp = pd.to_datetime(raw_payload["timestamp"])

    with timer.time("forecast_get_24h_precip"):
        forecast_24h_hourly_mm, forecast_24h_total_mm = get_24h_precip(lat, lon)

    with timer.time("forecast_parse"):
        forecast_hourly_list = [float(x) for x in forecast_24h_hourly_mm]
        forecast_total = float(forecast_24h_total_mm)

    with timer.time("qc_samples_and_summarize"):
        cleaned_readings, qc_report = QC_samples_and_summarize(
            current_reading=raw_payload["samples"],
            previous_valid_reading=previous_raw_payload["samples"],
            timestamp=timestamp,
        )

    qc_failed = bool(qc_report.get("qc_failed", False))
    if qc_failed:
        with timer.time("build_latest_item_qc_failed"):
            latest_item = {
                "site_id": site_id,
                "last_updated_iso": now_iso,
                "forecast_24h_hourly_mm": forecast_hourly_list,
                "forecast_24h_total_mm": forecast_total,
                "qc_all_sensors_normal": False,
                "qc_used_fallback": False,
                "qc_report": qc_report,
            }

        with timer.time("ddb_put_latest_state_qc_failed"):
            storage.put_latest_state(latest_item)

        total_ms = (perf_counter() - t_total0) * 1000.0
        return RuntimeReport(
            total_ms=total_ms,
            stages_ms=timer.stages_ms,
            meta={"site_id": site_id, "now_iso": now_iso, "qc_failed": True},
        )

    with timer.time("normalize_moisture"):
        saturation = normalize_moisture(cleaned_readings, fc_vwc, sat_vwc)

    with timer.time("max_saturation"):
        max_normalized_saturation = max(saturation.values())

    with timer.time("compute_risk_score"):
        risk_score_internal, risk_score_displayed, base_soil_risk, storm_factor, site_sensitivity_factor = compute_risk_score(
            max_normalized_saturation,
            soil_saturation_1h_ago,
            forecast_24h_total_mm,
            idf_24h_mm,
        )

    with timer.time("build_latest_item"):
        qc_all_sensors_normal = bool(qc_report.get("all_sensors_normal", False))
        qc_used_fallback = bool(qc_report.get("used_fallback", False))

        latest_item = {
            "site_id": site_id,
            "last_updated_iso": now_iso,
            "sat_front": float(saturation["front"]),
            "sat_back": float(saturation["back"]),
            "sat_left": float(saturation["left"]),
            "sat_right": float(saturation["right"]),
            "max_sat": float(max_normalized_saturation),
            "forecast_24h_hourly_mm": forecast_hourly_list,
            "forecast_24h_total_mm": forecast_total,
            "base_soil_risk": float(base_soil_risk),
            "storm_factor": float(storm_factor),
            "site_sensitivity_factor": float(site_sensitivity_factor),
            "risk_score_internal": float(risk_score_internal),
            "risk_score": float(risk_score_displayed),
            "qc_all_sensors_normal": qc_all_sensors_normal,
            "qc_used_fallback": qc_used_fallback,
            "qc_report": qc_report,
        }

    with timer.time("ddb_put_latest_state"):
        storage.put_latest_state(latest_item)

    with timer.time("ddb_append_moisture_point"):
        storage.append_moisture_point(
            site_id=site_id,
            timestamp_iso=now_iso,
            max_sat=float(max_normalized_saturation),
        )

    total_ms = (perf_counter() - t_total0) * 1000.0
    return RuntimeReport(
        total_ms=total_ms,
        stages_ms=timer.stages_ms,
        meta={"site_id": site_id, "now_iso": now_iso, "qc_failed": False},
    )


def save_report(report: RuntimeReport, path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(asdict(report), f, indent=2)
