from src.utilities.quality_control import QC_samples_and_summarize
from src.utilities.normalization import normalize_moisture
from src.risk_model import compute_risk_score
from src.utilities.forecast_extraction import get_24h_precip
from src.aws_storage import AwsStorage, ddb_row_to_raw_payload

from datetime import datetime, timezone

import pandas as pd


def run_pipeline():
    REGION = "us-east-1"
    storage = AwsStorage(region=REGION)
    # TODO: replace with real site_id
    site_id = "site_001"

    config = storage.get_site_config(site_id)
    latest_row, prev_row = storage.get_latest_two_raw_payloads(site_id)
    raw_payload = ddb_row_to_raw_payload(latest_row)
    previous_raw_payload = ddb_row_to_raw_payload(prev_row)
    #TODO: replace with real 1h-ago soil saturation
    soil_saturation_1h_ago = 0.3
    lat = float(config["lat"])
    lon = float(config["lon"])
    fc_vwc = float(config["fc_vwc"])
    sat_vwc = float(config["sat_vwc"])
    idf_24h_mm = float(config["idf_24h_2yr_mm"])

    timestamp = pd.to_datetime(raw_payload["timestamp"])

    cleaned_readings, qc_report = QC_samples_and_summarize(
        current_reading=raw_payload["samples"],
        previous_valid_reading=previous_raw_payload["samples"],
        timestamp=timestamp,
    )

    forecast_24h_hourly_mm, forecast_24h_total_mm = get_24h_precip(lat, lon)

    saturation = normalize_moisture(cleaned_readings, fc_vwc, sat_vwc)
    saturation_avg = (saturation["front"] +
                      saturation["back"] +
                      saturation["left"] +
                      saturation["right"]) / 4.0

    risk_score_internal, risk_score_displayed, base_soil_risk, storm_factor, site_sensitivity_factor = compute_risk_score(saturation_avg,
                                    soil_saturation_1h_ago,
                                    forecast_24h_total_mm,
                                    idf_24h_mm)
    
    forecast_hourly_list = [float(x) for x in forecast_24h_hourly_mm]
    forecast_total = float(forecast_24h_total_mm)

    qc_all_sensors_normal = bool(qc_report.get("all_sensors_normal", False))
    qc_used_fallback = bool(qc_report.get("used_fallback", False))

    last_updated_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    latest_item = {
        "site_id": site_id,
        "last_updated_iso": last_updated_iso,

        # per-side normalized saturation (0..1)
        "sat_front": float(saturation["front"]),
        "sat_back": float(saturation["back"]),
        "sat_left": float(saturation["left"]),
        "sat_right": float(saturation["right"]),
        "sat_avg": float(saturation_avg),

        # forecast
        "forecast_24h_hourly_mm": forecast_hourly_list,
        "forecast_24h_total_mm": forecast_total,

        # risk breakdown
        "base_soil_risk": float(base_soil_risk),
        "storm_factor": float(storm_factor),
        "site_sensitivity_factor": float(site_sensitivity_factor),
        "risk_score_internal": float(risk_score_internal),
        "risk_score": float(risk_score_displayed),

        # QC flags + full report as a MAP
        "qc_all_sensors_normal": qc_all_sensors_normal,
        "qc_used_fallback": qc_used_fallback,
        "qc_report": qc_report, 
    }

    storage.put_latest_state(latest_item)

    storage.append_moisture_point(
        site_id=site_id,
        timestamp_iso=last_updated_iso,
        sat_avg=float(saturation_avg),
    )

    print(f"Wrote results to AWS")

def main():
    run_pipeline()

if __name__ == "__main__":
    main()