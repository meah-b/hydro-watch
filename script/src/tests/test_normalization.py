import pytest

from src.utilities.normalization import normalize_moisture


def test_normalization_at_field_capacity_is_zero():
    cleaned = {"front": 0.30}
    fc = 0.30
    sat = 0.50

    out = normalize_moisture(cleaned, fc, sat)

    assert out["front"] == pytest.approx(0.0)


def test_normalization_at_saturation_is_one():
    cleaned = {"front": 0.50}
    fc = 0.30
    sat = 0.50

    out = normalize_moisture(cleaned, fc, sat)

    assert out["front"] == pytest.approx(1.0)


def test_normalization_midpoint_is_half():
    cleaned = {"front": 0.40}
    fc = 0.30
    sat = 0.50

    out = normalize_moisture(cleaned, fc, sat)

    assert out["front"] == pytest.approx(0.5)


def test_normalization_below_field_capacity_is_negative():
    cleaned = {"front": 0.25}
    fc = 0.30
    sat = 0.50

    out = normalize_moisture(cleaned, fc, sat)

    assert out["front"] < 0.0
    assert out["front"] == pytest.approx(-0.25)


def test_normalization_above_saturation_exceeds_one():
    cleaned = {"front": 0.55}
    fc = 0.30
    sat = 0.50

    out = normalize_moisture(cleaned, fc, sat)

    assert out["front"] > 1.0
    assert out["front"] == pytest.approx(1.25)


def test_normalization_multiple_sensors():
    cleaned = {
        "front": 0.30,
        "back": 0.35,
        "left": 0.40,
        "right": 0.45,
    }
    fc = 0.30
    sat = 0.50

    out = normalize_moisture(cleaned, fc, sat)

    assert out["front"] == pytest.approx(0.0)
    assert out["back"] == pytest.approx(0.25)
    assert out["left"] == pytest.approx(0.5)
    assert out["right"] == pytest.approx(0.75)


def test_normalization_outputs_are_floats():
    cleaned = {"front": 0.40}
    fc = 0.30
    sat = 0.50

    out = normalize_moisture(cleaned, fc, sat)

    assert isinstance(out["front"], float)
