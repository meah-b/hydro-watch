import pytest

from src.risk_components.site_sensitivity import compute_site_sensitivity_component


def test_site_sensitivity_negative_delta_is_clipped_to_zero():
    # saturation decreased -> delta_S clipped to 0
    assert compute_site_sensitivity_component(0.40, 0.50) == pytest.approx(0.0)


def test_site_sensitivity_zero_delta_is_zero():
    assert compute_site_sensitivity_component(0.50, 0.50) == pytest.approx(0.0)


def test_site_sensitivity_scales_linearly_up_to_delta_ref():
    # DELTA_S_REF = 0.1 inside function
    # delta = 0.05 -> index = 0.5
    assert compute_site_sensitivity_component(0.55, 0.50) == pytest.approx(0.5)

    # delta = 0.02 -> 0.2
    assert compute_site_sensitivity_component(0.52, 0.50) == pytest.approx(0.2)


def test_site_sensitivity_caps_at_one_for_large_increases():
    # delta >= 0.1 -> 1.0
    assert compute_site_sensitivity_component(0.60, 0.50) == pytest.approx(1.0)  # delta 0.10
    assert compute_site_sensitivity_component(0.80, 0.50) == pytest.approx(1.0)  # delta 0.30


def test_site_sensitivity_output_is_always_in_0_to_1():
    cases = [
        (0.0, 0.0),
        (0.2, 0.1),
        (0.1, 0.2), 
        (1.2, 1.0),  
        (-0.2, -0.3),
    ]
    for now, prev in cases:
        v = compute_site_sensitivity_component(now, prev)
        assert 0.0 <= v <= 1.0
