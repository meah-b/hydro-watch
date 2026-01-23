from __future__ import annotations

from src.risk_components.soil_saturation import compute_soil_saturation_component
from src.risk_components.storm_severity import compute_storm_severity_component
from src.risk_components.site_sensitivity import compute_site_sensitivity_component
from src.utilities.risk_model import compute_risk_score


def _nondecreasing(xs: list[float]) -> bool:
    return all(b >= a for a, b in zip(xs, xs[1:]))


def test_soil_component_is_monotonic_in_S():
    Ss = [i / 100 for i in range(0, 151)] 
    scores = [compute_soil_saturation_component(S) for S in Ss]
    assert _nondecreasing(scores)
    assert min(scores) >= 0.0
    assert max(scores) <= 100.0


def test_storm_factor_is_monotonic_in_ratio():
    idf = 100.0
    forecasts = [i for i in range(0, 201)]  
    factors = [compute_storm_severity_component(f, idf) for f in forecasts]
    assert _nondecreasing(factors)
    assert min(factors) >= 0.0
    assert max(factors) <= 1.5


def test_site_sensitivity_is_monotonic_in_deltaS_and_clamped():
    S_ago = 0.50
    S_nows = [S_ago + i / 1000 for i in range(0, 201)] 
    idx = [compute_site_sensitivity_component(s_now, S_ago) for s_now in S_nows]
    assert _nondecreasing(idx)
    assert min(idx) >= 0.0
    assert max(idx) <= 1.0
    assert idx[-1] == 1.0 


def test_displayed_risk_is_monotonic_in_soil_saturation_when_other_inputs_fixed():
    S_ago = 0.30
    forecast = 50.0
    idf = 100.0

    Ss = [i / 100 for i in range(0, 151)]
    displayed = []
    for S_now in Ss:
        _, risk_displayed, *_ = compute_risk_score(S_now, S_ago, forecast, idf)
        displayed.append(risk_displayed)

    assert _nondecreasing(displayed)
    assert min(displayed) >= 0.0
    assert max(displayed) <= 100.0
