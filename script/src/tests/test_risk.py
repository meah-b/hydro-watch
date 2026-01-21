import pytest

from src.utilities.risk_model import compute_risk_score


def test_risk_model_dry_soil_stays_zero_even_with_big_storm_and_high_sensitivity():
    # Soil saturation <= 0.2 -> base soil risk = 0
    # Risk internal/displayed should be 0 regardless of storm/sensitivity.
    internal, displayed, base, storm, sens = compute_risk_score(
        soil_saturation_current=0.10,
        soil_saturation_1h_ago=0.00,   # delta positive, sens would be >0, but shouldn't matter
        forecast_24h_mm=200.0,
        IDF_24h_2yr_mm=100.0,
    )

    assert base == pytest.approx(0.0)
    assert internal == pytest.approx(0.0)
    assert displayed == pytest.approx(0.0)
    assert 0.0 <= storm <= 1.5
    assert 0.0 <= sens <= 1.0


def test_risk_model_no_amplification_when_sensitivity_is_zero():
    # If soil_saturation_current == soil_saturation_1h_ago, sensitivity = 0
    # amplification = 1, so internal = base and displayed = base (if <=100)
    internal, displayed, base, storm, sens = compute_risk_score(
        soil_saturation_current=0.60,  # base = 35 (from soil component)
        soil_saturation_1h_ago=0.60,   # sens = 0
        forecast_24h_mm=150.0,
        IDF_24h_2yr_mm=100.0,          # storm ratio 1.5 -> storm factor 1.5 (capped)
    )

    assert base == pytest.approx(35.0)
    assert sens == pytest.approx(0.0)
    assert storm == pytest.approx(1.5)
    assert internal == pytest.approx(base)     # no amplification
    assert displayed == pytest.approx(base)    # still under 100


def test_risk_model_known_mid_case_with_partial_amplification():
    # Choose values that give clean math:
    # soil_current=0.6 -> base=35
    # soil_1h_ago=0.55 -> delta=0.05 -> sensitivity=0.5
    # forecast/idf = 1.0 -> storm factor = 1.0
    # amplification = 1 + 0.5*1.0 = 1.5
    # internal = 35 * 1.5 = 52.5
    internal, displayed, base, storm, sens = compute_risk_score(
        soil_saturation_current=0.60,
        soil_saturation_1h_ago=0.55,
        forecast_24h_mm=100.0,
        IDF_24h_2yr_mm=100.0,
    )

    assert base == pytest.approx(35.0)
    assert sens == pytest.approx(0.5)
    assert storm == pytest.approx(1.0)
    assert internal == pytest.approx(52.5)
    assert displayed == pytest.approx(52.5)


def test_risk_model_displayed_is_clamped_to_100_when_internal_exceeds_100():
    # Make internal exceed 100:
    # soil_current=1.5 -> base=100
    # soil_1h_ago=1.4 -> delta=0.1 -> sensitivity=1.0
    # forecast/idf = 1.5 -> storm factor = 1.5
    # amplification = 1 + 1.0*1.5 = 2.5
    # internal = 100*2.5 = 250, displayed should clamp to 100
    internal, displayed, base, storm, sens = compute_risk_score(
        soil_saturation_current=1.50,
        soil_saturation_1h_ago=1.40,
        forecast_24h_mm=150.0,
        IDF_24h_2yr_mm=100.0,
    )

    assert base == pytest.approx(100.0)
    assert sens == pytest.approx(1.0)
    assert storm == pytest.approx(1.5)
    assert internal == pytest.approx(250.0)
    assert displayed == pytest.approx(100.0)


def test_risk_model_return_types_and_ranges():
    internal, displayed, base, storm, sens = compute_risk_score(
        soil_saturation_current=0.8,
        soil_saturation_1h_ago=0.75,
        forecast_24h_mm=65.0,
        IDF_24h_2yr_mm=100.0,
    )

    assert isinstance(internal, float)
    assert isinstance(displayed, float)
    assert isinstance(base, float)
    assert isinstance(storm, float)
    assert isinstance(sens, float)

    assert 0.0 <= displayed <= 100.0
    assert 0.0 <= storm <= 1.5
    assert 0.0 <= sens <= 1.0
