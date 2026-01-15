from src.risk_components.soil_saturation import compute_soil_saturation_component
from src.risk_components.storm_severity import compute_storm_severity_component
from src.risk_components.site_sensitivity import compute_site_sensitivity_component

from typing import Tuple


def compute_risk_score(
    soil_saturation_current: float,
    soil_saturation_1h_ago: float,
    forecast_24h_mm: float,
    IDF_24h_2yr_mm: float,
) -> Tuple[float, float, float, float, float]:
    """
    Compute the internal and displayed risk scores from the three components.

    Structure
    --------
    1. Compute a base soil risk score [0, 100] from saturation alone.
    2. Compute storm_severity_factor [0, 1.5] from forecast / IDF ratio.
    3. Compute site_sensitivity_factor [0, 1] from the last hour of soil behavior.
    4. Combine them multiplicatively:

           RiskInternal = BaseSoilRisk * (1 + site_sensitivity_factor
                                              * storm_severity_factor)

       This means:
         - If soil is very dry, RiskInternal stays low even for big storms.
         - If soil is wet but storms are small, RiskInternal is mostly
           determined by saturation.
         - If soil is wet, the site is reactive, and a severe storm is coming,
           RiskInternal can exceed 100 internally (extreme conditions).

    5. RiskDisplayed is then clamped to [0, 100] for user-facing simplicity.

    Returns
    -------
    risk_score_internal : float
        Raw hazard index that may exceed 100 in extreme conditions.
    risk_score_displayed : float
        Risk score clamped to [0, 100] for mapping to user categories.
    base_soil_risk: float
        Base risk score from soil saturation component alone.
    storm_factor: float
        Storm severity factor from forecast / IDF ratio.
    site_sensitivity_factor: float
        Site sensitivity factor from recent soil behavior.
    """

    base_soil_risk = compute_soil_saturation_component(soil_saturation_current)
    storm_factor = compute_storm_severity_component(forecast_24h_mm, IDF_24h_2yr_mm)
    site_sensitivity_factor = compute_site_sensitivity_component(
        soil_saturation_current, soil_saturation_1h_ago
    )

    amplification_factor = 1.0 + site_sensitivity_factor * storm_factor
    risk_score_internal = base_soil_risk * amplification_factor

    risk_score_displayed = max(0.0, min(risk_score_internal, 100.0))

    return risk_score_internal, risk_score_displayed, base_soil_risk, storm_factor, site_sensitivity_factor



