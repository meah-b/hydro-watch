from typing import Dict

def normalize_moisture(cleaned_readings: Dict[str, float], fc_vwc: float, sat_vwc: float) -> Dict[str, float]:
    """
    Convert raw soil moisture values into a normalized saturation measure.

    Definition:
    -----------
    For each sensor value vwc, we compute a normalized saturation:

        S = (vwc - fc_vwc) / (sat_vwc - fc_vwc)

    Interpretation:
    ---------------
    - S = 0   -> at field capacity (or below)
    - S = 1   -> at saturation (or above)
    - S < 0   -> drier than field capacity
    - S > 1   -> wetter than the nominal saturation (could indicate pooling or model mismatch)

    We DO NOT clamp S in this function so we can see when values fall outside
    the expected range. Any decisions about how to handle very high or low
    values should be made in the risk model.
    """


    saturation: Dict[str, float] = {}

    for key, vwc in cleaned_readings.items():
        S = (vwc - fc_vwc) / (sat_vwc - fc_vwc)
        saturation[key] = S

    return saturation
