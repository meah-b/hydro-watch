import pytest

from src.risk_components.soil_saturation import compute_soil_saturation_component


def test_soil_saturation_returns_zero_at_and_below_0p2():
    assert compute_soil_saturation_component(-0.5) == pytest.approx(0.0)
    assert compute_soil_saturation_component(0.0) == pytest.approx(0.0)
    assert compute_soil_saturation_component(0.2) == pytest.approx(0.0)


def test_soil_saturation_linear_region_maps_0p2_to_1p0_into_0_to_70():
    # S = 0.2 -> 0
    assert compute_soil_saturation_component(0.2) == pytest.approx(0.0)

    # S = 1.0 -> 70
    assert compute_soil_saturation_component(1.0) == pytest.approx(70.0)

    # Midpoint in [0.2, 1.0] is S=0.6
    # fraction = (0.6 - 0.2) / 0.8 = 0.5 => risk = 35
    assert compute_soil_saturation_component(0.6) == pytest.approx(35.0)

    # A couple extra points for confidence
    # S = 0.4 => fraction = (0.4-0.2)/0.8 = 0.25 => 17.5
    assert compute_soil_saturation_component(0.4) == pytest.approx(17.5)

    # S = 0.8 => fraction = (0.8-0.2)/0.8 = 0.75 => 52.5
    assert compute_soil_saturation_component(0.8) == pytest.approx(52.5)


def test_soil_saturation_wet_region_maps_1p0_to_1p5_into_70_to_100():
    # Just above 1.0 should be just above 70
    assert compute_soil_saturation_component(1.01) > 70.0

    # S = 1.25 is halfway between 1.0 and 1.5 -> 70 + 0.5*30 = 85
    assert compute_soil_saturation_component(1.25) == pytest.approx(85.0)

    # S = 1.5 -> 100
    assert compute_soil_saturation_component(1.5) == pytest.approx(100.0)


def test_soil_saturation_caps_at_100_above_1p5():
    assert compute_soil_saturation_component(1.6) == pytest.approx(100.0)
    assert compute_soil_saturation_component(2.0) == pytest.approx(100.0)
    assert compute_soil_saturation_component(10.0) == pytest.approx(100.0)


def test_soil_saturation_output_always_in_0_to_100_for_reasonable_inputs():
    for s in [-1.0, 0.0, 0.2, 0.5, 1.0, 1.25, 1.5, 2.0]:
        v = compute_soil_saturation_component(s)
        assert 0.0 <= v <= 100.0
