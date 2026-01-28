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

    assert report["qc_failed"] is False
    assert report["timestamp_ok"] is True

    assert report["all_sensors_present"] is True
    assert report["used_fallback"] is False
    assert report["fallback_sensors"] == []
    assert report["failed_sensors"] == []
    assert report["missing_sensors"] == []

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
    assert report["qc_failed"] is False
    assert report["used_fallback"] is True
    assert "front" in report["fallback_sensors"]
    assert report["all_sensors_normal"] is False


def test_qc_marks_failed_sensor_when_no_valid_samples_and_no_fallback():
    ts = _now_iso()

    current = {
        "front": [None, float("nan"), -1, "bad"],
        "back": [0.2],
        "left": [0.4],
        "right": [0.5],
    }

    cleaned, report = QC_samples_and_summarize(current, ts, previous_valid_reading=None)

    assert "front" in report["failed_sensors"]
    assert report["qc_failed"] is True  
    assert "back" in cleaned and "left" in cleaned and "right" in cleaned
    assert "front" not in cleaned


def test_qc_sets_qc_failed_true_if_nothing_usable_in_current_or_prev():
    ts = _now_iso()

    current = {
        "front": [None, float("nan"), -1, "bad"],
        "back": [None, float("nan")],
        "left": [None],
        "right": ["x", 2],
    }

    prev = {
        "front": [None, float("nan")],
        "back": ["x"],
        "left": [2],
        "right": [None],
    }

    cleaned, report = QC_samples_and_summarize(current, ts, previous_valid_reading=prev)

    assert cleaned == {}
    assert report["qc_failed"] is True
    assert report["usable_sensor_count"] == 0


def test_qc_marks_missing_sensor_and_fails():
    ts = _now_iso()

    current = {
        "front": [0.2],
        "back": [0.2],
        "left": [0.2],
    }

    cleaned, report = QC_samples_and_summarize(current, ts)

    assert report["qc_failed"] is True 
    assert "right" in report["missing_sensors"]
    assert "right" in report["failed_sensors"] 
    assert "front" in cleaned and "back" in cleaned and "left" in cleaned
    assert "right" not in cleaned


def test_qc_timestamp_too_old_falls_back_to_previous_if_available():
    ts_old = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()

    current = {"front": [0.2], "back": [0.2], "left": [0.2], "right": [0.2]}
    prev = {"front": [0.21], "back": [0.22], "left": [0.23], "right": [0.24]}

    cleaned, report = QC_samples_and_summarize(current, ts_old, previous_valid_reading=prev)

    assert report["timestamp_ok"] is False
    assert report["qc_failed"] is False
    assert report["used_fallback"] is True
    assert set(report["fallback_sensors"]) == {"front", "back", "left", "right"}
    assert cleaned["front"] == pytest.approx(0.21)
    assert cleaned["right"] == pytest.approx(0.24)


def test_qc_timestamp_too_far_in_future_falls_back_to_previous_if_available():
    ts_future = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    current = {"front": [0.2], "back": [0.2], "left": [0.2], "right": [0.2]}
    prev = {"front": [0.31], "back": [0.32], "left": [0.33], "right": [0.34]}

    cleaned, report = QC_samples_and_summarize(current, ts_future, previous_valid_reading=prev)

    assert report["timestamp_ok"] is False
    assert report["qc_failed"] is False
    assert report["used_fallback"] is True
    assert set(report["fallback_sensors"]) == {"front", "back", "left", "right"}
    assert cleaned["back"] == pytest.approx(0.32)


def test_qc_timestamp_bad_and_no_prev_means_qc_failed():
    ts_future = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    current = {"front": [0.2], "back": [0.2], "left": [0.2], "right": [0.2]}

    cleaned, report = QC_samples_and_summarize(current, ts_future, previous_valid_reading=None)

    assert report["timestamp_ok"] is False
    assert report["qc_failed"] is True
    assert cleaned == {}
