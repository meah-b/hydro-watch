import math
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any, Union
from statistics import median
from datetime import datetime, timezone


def _sample_passes_basic_qc(value: Any) -> bool:
    if value is None:
        return False
    try:
        v = float(value)
    except (TypeError, ValueError):
        return False
    if math.isnan(v):
        return False
    return 0.0 <= v <= 1.0


def _validate_timestamp(timestamp: Union[str, datetime, pd.Timestamp]) -> Tuple[bool, Dict[str, Any]]:
    max_future_skew_seconds: int = 300
    max_age_seconds: int = 3600

    report: Dict[str, Any] = {
        "timestamp_ok": False,
        "timestamp_iso": None,
        "timestamp_age_seconds": None,
        "timestamp_reason": None,
    }

    try:
        ts = pd.to_datetime(timestamp, utc=True)
    except Exception as e:
        report["timestamp_reason"] = f"unparseable_timestamp: {e}"
        return False, report

    if pd.isna(ts):
        report["timestamp_reason"] = "timestamp_is_na"
        return False, report

    ts_dt: datetime = ts.to_pydatetime().astimezone(timezone.utc)
    now = datetime.now(timezone.utc)

    age_seconds = (now - ts_dt).total_seconds()
    report["timestamp_iso"] = ts_dt.isoformat().replace("+00:00", "Z")
    report["timestamp_age_seconds"] = age_seconds

    if age_seconds < -max_future_skew_seconds:
        report["timestamp_reason"] = "timestamp_too_far_in_future"
        return False, report

    if age_seconds > max_age_seconds:
        report["timestamp_reason"] = "timestamp_too_old"
        return False, report

    report["timestamp_ok"] = True
    report["timestamp_reason"] = "ok"
    return True, report


def _median_of_valid_samples(sample_list: Optional[List[Any]]) -> Optional[float]:
    """
    Returns median of samples that pass basic QC.
    If none pass, returns None.
    """
    if not sample_list:
        return None

    vals: List[float] = []
    for x in sample_list:
        if _sample_passes_basic_qc(x):
            vals.append(float(x))

    if not vals:
        return None

    return float(median(vals))


def QC_samples_and_summarize(
    current_reading: Dict[str, List[Any]],
    timestamp: Union[str, datetime, pd.Timestamp],
    previous_valid_reading: Optional[Dict[str, List[Any]]] = None,
) -> Tuple[Dict[str, float], Dict[str, Any]]:

    sensors = ["front", "back", "left", "right"]

    cleaned: Dict[str, float] = {}
    invalid_samples_removed: Dict[str, int] = {}
    valid_samples_kept: Dict[str, int] = {}
    missing_sensors: List[str] = []
    fallback_sensors: List[str] = []
    failed_sensors: List[str] = []

    ts_ok, ts_fields = _validate_timestamp(timestamp)

    current_is_usable = bool(ts_ok)

    for sensor in sensors:
        invalid_samples_removed[sensor] = 0
        valid_samples_kept[sensor] = 0

        if current_is_usable and current_reading and sensor in current_reading:
            raw_list = current_reading.get(sensor) or []

            kept = 0
            removed = 0
            valid_vals: List[float] = []
            for x in raw_list:
                if _sample_passes_basic_qc(x):
                    kept += 1
                    valid_vals.append(float(x))
                else:
                    removed += 1

            invalid_samples_removed[sensor] = removed
            valid_samples_kept[sensor] = kept

            if valid_vals:
                cleaned[sensor] = float(median(valid_vals))
                continue
        else:
            if not current_reading or sensor not in current_reading:
                missing_sensors.append(sensor)

        prev_list = None
        if previous_valid_reading is not None:
            prev_list = previous_valid_reading.get(sensor)

        prev_median = _median_of_valid_samples(prev_list)
        if prev_median is not None:
            cleaned[sensor] = float(prev_median)
            fallback_sensors.append(sensor)
            continue

        failed_sensors.append(sensor)

    used_fallback = (len(fallback_sensors) > 0)
    all_sensors_present = (len(missing_sensors) == 0)

    qc_failed = (len(cleaned) != 4)

    all_sensors_normal = (
        all_sensors_present
        and len(fallback_sensors) == 0
        and len(failed_sensors) == 0
        and ts_ok
    )

    qc_report: Dict[str, Any] = {
        **ts_fields,  
        "qc_failed": qc_failed,
        "all_sensors_present": all_sensors_present,
        "all_sensors_normal": all_sensors_normal,
        "used_fallback": used_fallback,
        "missing_sensors": missing_sensors,
        "fallback_sensors": fallback_sensors,
        "failed_sensors": failed_sensors,
        "invalid_samples_removed": invalid_samples_removed,
        "valid_samples_kept": valid_samples_kept,
        "usable_sensors": list(cleaned.keys()),
        "usable_sensor_count": len(cleaned),
        "current_reading_used": ts_ok, 
    }

    return cleaned, qc_report
