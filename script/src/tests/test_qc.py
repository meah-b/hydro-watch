from datetime import datetime, timedelta, timezone

import pytest

from src.utilities.quality_control import QC_samples_and_summarize


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def test_qc_filters_invalid_and_returns_median_per_sensor():
    ts = _now_iso()

    current = {
        "front": [0.10, 0.30, None, "bad", -0.2, 1.2, float("nan")], 
        "back": [0.50, 0.60, 0.70],                                 
        "left": ["0.25", 0.25, 0.25],                           
        "right": [0.0, 1.0, 0.9],                                    
    }

    cleaned, report = QC_samples_and_summarize(current, ts)

    assert cleaned["front"] == pytest.approx(0.20)
    assert cleaned["back"] == pytest.approx(0.60)
    assert cleaned["left"] == pytest.approx(0.25)
    assert cleaned["right"] == pytest.approx(0.90)

    assert report["all_sensors_present"] is True
    assert report["used_fallback"] is False
    assert report["fallback_sensors"] == []
    assert report["failed_sensors"] == []

    assert report["valid_samples_kept"]["front"] == 2
    assert report["invalid_samples_removed"]["front"] == 5


def test_qc_uses_previous_valid_reading_fallback_when_current_invalid():
    ts = _now_iso()

    current = {
        "front": [None, float("nan"), -1, 2, "x"],  
        "back": [0.2, 0.3],
        "left": [0.4],
        "right": [0.5],
    }

    prev = {
        "front": [0.11, 0.13, 0.15], 
        "back": [0.2],
        "left": [0.4],
        "right": [0.5],
    }

    cleaned, report = QC_samples_and_summarize(current, ts, previous_valid_reading=prev)

    assert cleaned["front"] == pytest.approx(0.13)
    assert report["used_fallback"] is True
    assert "front" in report["fallback_sensors"]
    assert report["all_sensors_normal"] is False  


def test_qc_raises_if_sensor_has_no_valid_samples_and_no_fallback():
    ts = _now_iso()

    current = {
        "front": [None, float("nan"), -1, "bad"],  
        "back": [0.2],
        "left": [0.4],
        "right": [0.5],
    }

    with pytest.raises(ValueError, match="no valid samples.*no usable previous_valid_reading"):
        QC_samples_and_summarize(current, ts, previous_valid_reading=None)


def test_qc_marks_missing_sensor_and_raises():
    ts = _now_iso()

    current = {
        "front": [0.2],
        "back": [0.2],
        "left": [0.2],
        # "right" missing
    }

    with pytest.raises(ValueError):
        QC_samples_and_summarize(current, ts)


def test_qc_rejects_timestamp_too_old():
    ts_old = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()

    current = {"front": [0.2], "back": [0.2], "left": [0.2], "right": [0.2]}

    with pytest.raises(ValueError, match="bad timestamp"):
        QC_samples_and_summarize(current, ts_old)


def test_qc_rejects_timestamp_too_far_in_future():
    ts_future = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    current = {"front": [0.2], "back": [0.2], "left": [0.2], "right": [0.2]}

    with pytest.raises(ValueError, match="bad timestamp"):
        QC_samples_and_summarize(current, ts_future)
