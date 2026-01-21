import pytest

from src.risk_components.storm_severity import compute_storm_severity_component


def test_storm_severity_returns_zero_at_and_below_ratio_0p3():
    # ratio = forecast / idf
    assert compute_storm_severity_component(0.0, 100.0) == pytest.approx(0.0)   # ratio 0.0
    assert compute_storm_severity_component(30.0, 100.0) == pytest.approx(0.0)  # ratio 0.3
    assert compute_storm_severity_component(10.0, 100.0) == pytest.approx(0.0)  # ratio 0.1


def test_storm_severity_linear_region_0p3_to_1p0_maps_to_0_to_1():
    # ratio 0.3 -> 0
    assert compute_storm_severity_component(30.0, 100.0) == pytest.approx(0.0)

    # ratio 1.0 -> 1
    assert compute_storm_severity_component(100.0, 100.0) == pytest.approx(1.0)

    # ratio 0.65 is midpoint between 0.3 and 1.0:
    # (0.65-0.3)/0.7 = 0.5
    assert compute_storm_severity_component(65.0, 100.0) == pytest.approx(0.5)

    # a couple extra points
    # ratio 0.37 -> (0.37-0.3)/0.7 = 0.1
    assert compute_storm_severity_component(37.0, 100.0) == pytest.approx(0.1)

    # ratio 0.93 -> (0.93-0.3)/0.7 = 0.9
    assert compute_storm_severity_component(93.0, 100.0) == pytest.approx(0.9)


def test_storm_severity_high_region_1p0_to_1p5_maps_to_1_to_1p5():
    # ratio 1.0 -> 1.0
    assert compute_storm_severity_component(100.0, 100.0) == pytest.approx(1.0)

    # ratio 1.25 is halfway between 1.0 and 1.5:
    # 1.0 + ((1.25-1.0)/0.5)*0.5 = 1.25
    assert compute_storm_severity_component(125.0, 100.0) == pytest.approx(1.25)

    # ratio 1.5 -> 1.5
    assert compute_storm_severity_component(150.0, 100.0) == pytest.approx(1.5)


def test_storm_severity_caps_at_1p5_above_ratio_1p5():
    assert compute_storm_severity_component(200.0, 100.0) == pytest.approx(1.5)  # ratio 2.0
    assert compute_storm_severity_component(999.0, 100.0) == pytest.approx(1.5)


def test_storm_severity_output_in_expected_range_for_reasonable_inputs():
    for forecast, idf in [
        (0.0, 100.0),
        (30.0, 100.0),
        (65.0, 100.0),
        (100.0, 100.0),
        (125.0, 100.0),
        (150.0, 100.0),
        (300.0, 100.0),
    ]:
        v = compute_storm_severity_component(forecast, idf)
        assert 0.0 <= v <= 1.5


def test_storm_severity_raises_on_zero_idf():
    with pytest.raises(ZeroDivisionError):
        compute_storm_severity_component(10.0, 0.0)
