from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from itertools import product
import csv
import random
from typing import Any, Dict, List, Tuple, Optional

import pandas as pd

from src.utilities.quality_control import QC_samples_and_summarize
from src.utilities.normalization import normalize_moisture
from src.utilities.risk_model import compute_risk_score

SENSORS = ["front", "back", "left", "right"]

IDF_24H_2YR_MM = 60.91

BASELINE_SOIL = "clay_loam"
BASELINE_FC = 0.36
BASELINE_SAT = 0.48

SOIL_TABLE: Dict[str, Dict[str, float]] = {
    "sand": {"fc": 0.10, "sat": 0.46},
    "loamy_sand": {"fc": 0.12, "sat": 0.46},
    "sandy_loam": {"fc": 0.18, "sat": 0.45},
    "loam": {"fc": 0.28, "sat": 0.46},
    "silt_loam": {"fc": 0.31, "sat": 0.48},
    "silt": {"fc": 0.30, "sat": 0.48},
    "sandy_clay_loam": {"fc": 0.27, "sat": 0.43},
    "clay_loam": {"fc": 0.36, "sat": 0.48},
    "silty_clay_loam": {"fc": 0.38, "sat": 0.51},
    "silty_clay": {"fc": 0.41, "sat": 0.52},
    "sandy_clay": {"fc": 0.36, "sat": 0.44},
    "clay": {"fc": 0.42, "sat": 0.50},
}


LOW_MAX = 25.0
MOD_MAX = 50.0
HIGH_MAX = 75.0

CATEGORY_MARGIN = 2.0 


def risk_category(risk_display: float) -> str:
    if risk_display <= LOW_MAX:
        return "LOW"
    if risk_display <= MOD_MAX:
        return "MODERATE"
    if risk_display <= HIGH_MAX:
        return "HIGH"
    return "SEVERE"


def in_category_with_margin(risk_display: float, cat: str) -> bool:
    if cat == "LOW":
        return risk_display <= (LOW_MAX - CATEGORY_MARGIN)
    if cat == "MODERATE":
        return (LOW_MAX + CATEGORY_MARGIN) < risk_display <= (MOD_MAX - CATEGORY_MARGIN)
    if cat == "HIGH":
        return (MOD_MAX + CATEGORY_MARGIN) < risk_display <= (HIGH_MAX - CATEGORY_MARGIN)
    if cat == "SEVERE":
        return risk_display >= (HIGH_MAX + CATEGORY_MARGIN)
    raise ValueError(f"Unknown category: {cat}")


@dataclass
class SeedRow:
    risk_regime: str
    moisture_profile: str
    moisture_offset: float
    forecast_24h_total_mm: float
    soil_saturation_1h_ago: float
    fc_vwc: float
    sat_vwc: float
    idf_24h_mm: float
    max_sat: float
    risk_internal: float
    risk_display: float
    base_soil_risk: float
    storm_factor: float
    site_sensitivity_factor: float


@dataclass
class SoilMisclassificationRow:
    risk_regime: str
    moisture_profile: str
    baseline_soil: str
    assumed_soil: str
    forecast_24h_total_mm: float
    soil_saturation_1h_ago: float
    fc_vwc: float
    sat_vwc: float
    idf_24h_mm: float

    max_sat: float
    risk_internal: float
    risk_display: float
    risk_category: str
    base_soil_risk: float
    storm_factor: float
    site_sensitivity_factor: float

    delta_risk: float
    delta_base_soil_risk: float
    delta_storm_factor: float
    delta_site_sensitivity: float
    category_changed: bool

    qc_failed: bool
    qc_used_fallback: bool
    qc_all_sensors_normal: bool


@dataclass
class ForecastSensitivityRow:
    risk_regime: str
    moisture_profile: str
    forecast_24h_total_mm: float
    soil_saturation_1h_ago: float
    fc_vwc: float
    sat_vwc: float
    idf_24h_mm: float

    max_sat: float
    risk_internal: float
    risk_display: float
    risk_category: str
    base_soil_risk: float
    storm_factor: float
    site_sensitivity_factor: float

    delta_risk: float
    delta_base_soil_risk: float
    delta_storm_factor: float
    delta_site_sensitivity: float
    category_changed: bool

    qc_failed: bool
    qc_used_fallback: bool
    qc_all_sensors_normal: bool


@dataclass
class MoistureBiasRow:
    risk_regime: str
    moisture_profile: str
    moisture_bias: float
    forecast_24h_total_mm: float
    soil_saturation_1h_ago: float
    fc_vwc: float
    sat_vwc: float
    idf_24h_mm: float

    max_sat: float
    risk_internal: float
    risk_display: float
    risk_category: str
    base_soil_risk: float
    storm_factor: float
    site_sensitivity_factor: float

    delta_risk: float
    delta_base_soil_risk: float
    delta_storm_factor: float
    delta_site_sensitivity: float
    category_changed: bool

    qc_failed: bool
    qc_used_fallback: bool
    qc_all_sensors_normal: bool


@dataclass
class RateOfChangeRow:
    risk_regime: str
    moisture_profile: str
    rate_delta: float  
    forecast_24h_total_mm: float
    soil_saturation_1h_ago: float
    fc_vwc: float
    sat_vwc: float
    idf_24h_mm: float

    max_sat: float
    risk_internal: float
    risk_display: float
    risk_category: str
    base_soil_risk: float
    storm_factor: float
    site_sensitivity_factor: float

    delta_risk: float
    delta_base_soil_risk: float
    delta_storm_factor: float
    delta_site_sensitivity: float
    category_changed: bool

    qc_failed: bool
    qc_used_fallback: bool
    qc_all_sensors_normal: bool


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _samples_with_noise(center: float, n: int = 8, sigma: float = 0.003) -> List[float]:
    return [_clamp01(random.gauss(center, sigma)) for _ in range(n)]


def _samples_dict_noise(front: float, back: float, left: float, right: float) -> Dict[str, List[float]]:
    return {
        "front": _samples_with_noise(front),
        "back": _samples_with_noise(back),
        "left": _samples_with_noise(left),
        "right": _samples_with_noise(right),
    }


def _offset_samples(samples: Dict[str, List[float]], offset: float) -> Dict[str, List[float]]:
    out: Dict[str, List[float]] = {}
    for k, vals in samples.items():
        out[k] = [_clamp01(v + offset) for v in vals]
    return out


def run_one(
    *,
    current_samples: Dict[str, List[float]],
    previous_samples: Dict[str, List[float]],
    fc_vwc: float,
    sat_vwc: float,
    soil_saturation_1h_ago: float,
    forecast_24h_total_mm: float,
    idf_24h_mm: float,
) -> Tuple[bool, Dict[str, Any]]:
    ts = pd.to_datetime(datetime.now(timezone.utc).isoformat())

    cleaned, qc_report = QC_samples_and_summarize(
        current_reading=current_samples,
        previous_valid_reading=previous_samples,
        timestamp=ts,
    )

    qc_failed = bool(qc_report.get("qc_failed", False))
    if qc_failed:
        return True, {
            "qc_report": qc_report,
            "qc_used_fallback": False,
            "qc_all_sensors_normal": False,
        }

    sat = normalize_moisture(cleaned, fc_vwc, sat_vwc)
    max_sat = float(max(sat.values()))

    r_int, r_disp, base, storm, site = compute_risk_score(
        max_sat,
        soil_saturation_1h_ago,
        forecast_24h_total_mm,
        idf_24h_mm,
    )

    return False, {
        "max_sat": max_sat,
        "risk_internal": float(r_int),
        "risk_display": float(r_disp),
        "base_soil_risk": float(base),
        "storm_factor": float(storm),
        "site_sensitivity_factor": float(site),
        "qc_used_fallback": bool(qc_report.get("used_fallback", False)),
        "qc_all_sensors_normal": bool(qc_report.get("all_sensors_normal", False)),
        "qc_report": qc_report,
    }


def write_csv(rows: List[Any], path: str) -> None:
    if not rows:
        raise ValueError(f"No rows to write: {path}")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(asdict(rows[0]).keys()))
        w.writeheader()
        for r in rows:
            w.writerow(asdict(r))


def build_profiles(seed: int) -> Tuple[
    Dict[str, Dict[str, List[float]]],
    Dict[str, Dict[str, List[float]]]
]:
    random.seed(seed)
    current: Dict[str, Dict[str, List[float]]] = {
        "dry": _samples_dict_noise(0.18, 0.19, 0.17, 0.18),
        "mid": _samples_dict_noise(0.30, 0.31, 0.29, 0.30),
        "wet": _samples_dict_noise(0.43, 0.44, 0.42, 0.43),
    }
    prev: Dict[str, Dict[str, List[float]]] = {
        "dry": _samples_dict_noise(0.17, 0.18, 0.16, 0.17),
        "mid": _samples_dict_noise(0.29, 0.30, 0.28, 0.29),
        "wet": _samples_dict_noise(0.42, 0.43, 0.41, 0.42),
    }
    return current, prev


# ----------------------------
# Step 1: Find 4 baseline seeds (LOW/MOD/HIGH/SEVERE)
# This makes the “regimes” meaningful: each regime actually produces that category at baseline.
# ----------------------------
def find_seeds(
    *,
    current_profiles: Dict[str, Dict[str, List[float]]],
    prev_profiles: Dict[str, Dict[str, List[float]]],
) -> Tuple[List[SeedRow], Dict[str, Dict[str, Any]]]:
    targets = ["LOW", "MODERATE", "HIGH", "SEVERE"]

    moisture_offsets = [-0.06, -0.04, -0.02, 0.0, 0.02, 0.04, 0.06, 0.08]
    forecast_levels = [0.0, 10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 75.0, 90.0, 105.0]
    past_sats = [0.0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9]

    chosen: Dict[str, Dict[str, Any]] = {}
    seed_rows: List[SeedRow] = []

    profile_order = ["dry", "mid", "wet"]

    for target_cat in targets:
        best: Optional[Dict[str, Any]] = None

        for prof in profile_order:
            cur0 = current_profiles[prof]
            prev0 = prev_profiles[prof]

            for off, forecast_mm, past_sat in product(moisture_offsets, forecast_levels, past_sats):
                cur = _offset_samples(cur0, off)
                prev = _offset_samples(prev0, off)

                qc_failed, out = run_one(
                    current_samples=cur,
                    previous_samples=prev,
                    fc_vwc=BASELINE_FC,
                    sat_vwc=BASELINE_SAT,
                    soil_saturation_1h_ago=float(past_sat),
                    forecast_24h_total_mm=float(forecast_mm),
                    idf_24h_mm=IDF_24H_2YR_MM,
                )
                if qc_failed:
                    continue

                rd = float(out["risk_display"])
                if not in_category_with_margin(rd, target_cat):
                    continue

                # Prefer seeds not too close to bounds and with “reasonable” forecast
                # Score lower is better
                # (1) distance to category center-ish (rough)
                if target_cat == "LOW":
                    center = (LOW_MAX - CATEGORY_MARGIN) / 2.0
                elif target_cat == "MODERATE":
                    center = (LOW_MAX + MOD_MAX) / 2.0
                elif target_cat == "HIGH":
                    center = (MOD_MAX + HIGH_MAX) / 2.0
                else:
                    center = 90.0
                dist = abs(rd - center)

                score = dist + 0.01 * abs(forecast_mm - 40.0) + 2.0 * abs(off)

                cand = {
                    "risk_regime": target_cat,
                    "moisture_profile": prof,
                    "moisture_offset": float(off),
                    "forecast_24h_total_mm": float(forecast_mm),
                    "soil_saturation_1h_ago": float(past_sat),
                    "current_samples": cur,
                    "previous_samples": prev,
                    "out": out,
                    "score": score,
                }

                if best is None or cand["score"] < best["score"]:
                    best = cand

        if best is None:
            raise RuntimeError(
                f"Could not find baseline seed for category '{target_cat}'. "
                f"Adjust thresholds or expand search grids."
            )

        chosen[target_cat] = best
        o = best["out"]
        seed_rows.append(SeedRow(
            risk_regime=best["risk_regime"],
            moisture_profile=best["moisture_profile"],
            moisture_offset=best["moisture_offset"],
            forecast_24h_total_mm=best["forecast_24h_total_mm"],
            soil_saturation_1h_ago=best["soil_saturation_1h_ago"],
            fc_vwc=BASELINE_FC,
            sat_vwc=BASELINE_SAT,
            idf_24h_mm=IDF_24H_2YR_MM,
            max_sat=float(o["max_sat"]),
            risk_internal=float(o["risk_internal"]),
            risk_display=float(o["risk_display"]),
            base_soil_risk=float(o["base_soil_risk"]),
            storm_factor=float(o["storm_factor"]),
            site_sensitivity_factor=float(o["site_sensitivity_factor"]),
        ))

    return seed_rows, chosen


# ----------------------------
# Experiment 1: Soil misclassification (only allowed soil combos)
# For each risk regime seed, swap soil (fc,sat) from SOIL_TABLE and observe deltas + category flips.
# ----------------------------
def experiment_soil_misclassification(
    *,
    seeds: Dict[str, Dict[str, Any]],
) -> List[SoilMisclassificationRow]:
    rows: List[SoilMisclassificationRow] = []

    for regime, seed in seeds.items():
        cur = seed["current_samples"]
        prev = seed["previous_samples"]
        forecast_mm = seed["forecast_24h_total_mm"]
        past_sat = seed["soil_saturation_1h_ago"]

        # Baseline run (clay_loam)
        qc_failed_base, base_out = run_one(
            current_samples=cur,
            previous_samples=prev,
            fc_vwc=BASELINE_FC,
            sat_vwc=BASELINE_SAT,
            soil_saturation_1h_ago=past_sat,
            forecast_24h_total_mm=forecast_mm,
            idf_24h_mm=IDF_24H_2YR_MM,
        )
        if qc_failed_base:
            raise RuntimeError(f"Baseline QC failed for regime seed: {regime}")

        base_cat = risk_category(float(base_out["risk_display"]))

        for assumed_soil, props in SOIL_TABLE.items():
            fc = float(props["fc"])
            sat = float(props["sat"])

            qc_failed, out = run_one(
                current_samples=cur,
                previous_samples=prev,
                fc_vwc=fc,
                sat_vwc=sat,
                soil_saturation_1h_ago=past_sat,
                forecast_24h_total_mm=forecast_mm,
                idf_24h_mm=IDF_24H_2YR_MM,
            )

            if qc_failed:
                rows.append(SoilMisclassificationRow(
                    risk_regime=regime,
                    moisture_profile=seed["moisture_profile"],
                    baseline_soil=BASELINE_SOIL,
                    assumed_soil=assumed_soil,
                    forecast_24h_total_mm=forecast_mm,
                    soil_saturation_1h_ago=past_sat,
                    fc_vwc=fc,
                    sat_vwc=sat,
                    idf_24h_mm=IDF_24H_2YR_MM,
                    max_sat=float("nan"),
                    risk_internal=float("nan"),
                    risk_display=float("nan"),
                    risk_category="QC_FAILED",
                    base_soil_risk=float("nan"),
                    storm_factor=float("nan"),
                    site_sensitivity_factor=float("nan"),
                    delta_risk=float("nan"),
                    delta_base_soil_risk=float("nan"),
                    delta_storm_factor=float("nan"),
                    delta_site_sensitivity=float("nan"),
                    category_changed=False,
                    qc_failed=True,
                    qc_used_fallback=False,
                    qc_all_sensors_normal=False,
                ))
                continue

            cat = risk_category(float(out["risk_display"]))
            rows.append(SoilMisclassificationRow(
                risk_regime=regime,
                moisture_profile=seed["moisture_profile"],
                baseline_soil=BASELINE_SOIL,
                assumed_soil=assumed_soil,
                forecast_24h_total_mm=forecast_mm,
                soil_saturation_1h_ago=past_sat,
                fc_vwc=fc,
                sat_vwc=sat,
                idf_24h_mm=IDF_24H_2YR_MM,
                max_sat=float(out["max_sat"]),
                risk_internal=float(out["risk_internal"]),
                risk_display=float(out["risk_display"]),
                risk_category=cat,
                base_soil_risk=float(out["base_soil_risk"]),
                storm_factor=float(out["storm_factor"]),
                site_sensitivity_factor=float(out["site_sensitivity_factor"]),
                delta_risk=float(out["risk_display"]) - float(base_out["risk_display"]),
                delta_base_soil_risk=float(out["base_soil_risk"]) - float(base_out["base_soil_risk"]),
                delta_storm_factor=float(out["storm_factor"]) - float(base_out["storm_factor"]),
                delta_site_sensitivity=float(out["site_sensitivity_factor"]) - float(base_out["site_sensitivity_factor"]),
                category_changed=(cat != base_cat),
                qc_failed=False,
                qc_used_fallback=bool(out["qc_used_fallback"]),
                qc_all_sensors_normal=bool(out["qc_all_sensors_normal"]),
            ))

    return rows


# ----------------------------
# Experiment 2: Forecast depth sensitivity (forecast wrong)
# Keep clay_loam, vary forecast depth for each risk regime seed.
# ----------------------------
def experiment_forecast_depth(
    *,
    seeds: Dict[str, Dict[str, Any]],
    forecast_levels: List[float],
) -> List[ForecastSensitivityRow]:
    rows: List[ForecastSensitivityRow] = []

    for regime, seed in seeds.items():
        cur = seed["current_samples"]
        prev = seed["previous_samples"]
        past_sat = seed["soil_saturation_1h_ago"]
        forecast_base = seed["forecast_24h_total_mm"]

        qc_failed_base, base_out = run_one(
            current_samples=cur,
            previous_samples=prev,
            fc_vwc=BASELINE_FC,
            sat_vwc=BASELINE_SAT,
            soil_saturation_1h_ago=past_sat,
            forecast_24h_total_mm=forecast_base,
            idf_24h_mm=IDF_24H_2YR_MM,
        )
        if qc_failed_base:
            raise RuntimeError(f"Baseline QC failed for forecast experiment regime: {regime}")
        base_cat = risk_category(float(base_out["risk_display"]))

        for f_mm in forecast_levels:
            qc_failed, out = run_one(
                current_samples=cur,
                previous_samples=prev,
                fc_vwc=BASELINE_FC,
                sat_vwc=BASELINE_SAT,
                soil_saturation_1h_ago=past_sat,
                forecast_24h_total_mm=float(f_mm),
                idf_24h_mm=IDF_24H_2YR_MM,
            )

            if qc_failed:
                rows.append(ForecastSensitivityRow(
                    risk_regime=regime,
                    moisture_profile=seed["moisture_profile"],
                    forecast_24h_total_mm=float(f_mm),
                    soil_saturation_1h_ago=past_sat,
                    fc_vwc=BASELINE_FC,
                    sat_vwc=BASELINE_SAT,
                    idf_24h_mm=IDF_24H_2YR_MM,
                    max_sat=float("nan"),
                    risk_internal=float("nan"),
                    risk_display=float("nan"),
                    risk_category="QC_FAILED",
                    base_soil_risk=float("nan"),
                    storm_factor=float("nan"),
                    site_sensitivity_factor=float("nan"),
                    delta_risk=float("nan"),
                    delta_base_soil_risk=float("nan"),
                    delta_storm_factor=float("nan"),
                    delta_site_sensitivity=float("nan"),
                    category_changed=False,
                    qc_failed=True,
                    qc_used_fallback=False,
                    qc_all_sensors_normal=False,
                ))
                continue

            cat = risk_category(float(out["risk_display"]))
            rows.append(ForecastSensitivityRow(
                risk_regime=regime,
                moisture_profile=seed["moisture_profile"],
                forecast_24h_total_mm=float(f_mm),
                soil_saturation_1h_ago=past_sat,
                fc_vwc=BASELINE_FC,
                sat_vwc=BASELINE_SAT,
                idf_24h_mm=IDF_24H_2YR_MM,
                max_sat=float(out["max_sat"]),
                risk_internal=float(out["risk_internal"]),
                risk_display=float(out["risk_display"]),
                risk_category=cat,
                base_soil_risk=float(out["base_soil_risk"]),
                storm_factor=float(out["storm_factor"]),
                site_sensitivity_factor=float(out["site_sensitivity_factor"]),
                delta_risk=float(out["risk_display"]) - float(base_out["risk_display"]),
                delta_base_soil_risk=float(out["base_soil_risk"]) - float(base_out["base_soil_risk"]),
                delta_storm_factor=float(out["storm_factor"]) - float(base_out["storm_factor"]),
                delta_site_sensitivity=float(out["site_sensitivity_factor"]) - float(base_out["site_sensitivity_factor"]),
                category_changed=(cat != base_cat),
                qc_failed=False,
                qc_used_fallback=bool(out["qc_used_fallback"]),
                qc_all_sensors_normal=bool(out["qc_all_sensors_normal"]),
            ))

    return rows


# ----------------------------
# Experiment 3: Soil moisture bias sensitivity (sensor “wrong”)
# Keep forecast fixed (per seed baseline), keep clay_loam, apply ΔVWC bias to current+previous.
# ----------------------------
def experiment_moisture_bias(
    *,
    seeds: Dict[str, Dict[str, Any]],
    biases: List[float],
) -> List[MoistureBiasRow]:
    rows: List[MoistureBiasRow] = []

    for regime, seed in seeds.items():
        cur0 = seed["current_samples"]
        prev0 = seed["previous_samples"]
        past_sat = seed["soil_saturation_1h_ago"]
        forecast_base = seed["forecast_24h_total_mm"]

        qc_failed_base, base_out = run_one(
            current_samples=cur0,
            previous_samples=prev0,
            fc_vwc=BASELINE_FC,
            sat_vwc=BASELINE_SAT,
            soil_saturation_1h_ago=past_sat,
            forecast_24h_total_mm=forecast_base,
            idf_24h_mm=IDF_24H_2YR_MM,
        )
        if qc_failed_base:
            raise RuntimeError(f"Baseline QC failed for moisture bias regime: {regime}")
        base_cat = risk_category(float(base_out["risk_display"]))

        for b in biases:
            cur = _offset_samples(cur0, float(b))
            prev = _offset_samples(prev0, float(b))

            qc_failed, out = run_one(
                current_samples=cur,
                previous_samples=prev,
                fc_vwc=BASELINE_FC,
                sat_vwc=BASELINE_SAT,
                soil_saturation_1h_ago=past_sat,
                forecast_24h_total_mm=forecast_base,
                idf_24h_mm=IDF_24H_2YR_MM,
            )

            if qc_failed:
                rows.append(MoistureBiasRow(
                    risk_regime=regime,
                    moisture_profile=seed["moisture_profile"],
                    moisture_bias=float(b),
                    forecast_24h_total_mm=forecast_base,
                    soil_saturation_1h_ago=past_sat,
                    fc_vwc=BASELINE_FC,
                    sat_vwc=BASELINE_SAT,
                    idf_24h_mm=IDF_24H_2YR_MM,
                    max_sat=float("nan"),
                    risk_internal=float("nan"),
                    risk_display=float("nan"),
                    risk_category="QC_FAILED",
                    base_soil_risk=float("nan"),
                    storm_factor=float("nan"),
                    site_sensitivity_factor=float("nan"),
                    delta_risk=float("nan"),
                    delta_base_soil_risk=float("nan"),
                    delta_storm_factor=float("nan"),
                    delta_site_sensitivity=float("nan"),
                    category_changed=False,
                    qc_failed=True,
                    qc_used_fallback=False,
                    qc_all_sensors_normal=False,
                ))
                continue

            cat = risk_category(float(out["risk_display"]))
            rows.append(MoistureBiasRow(
                risk_regime=regime,
                moisture_profile=seed["moisture_profile"],
                moisture_bias=float(b),
                forecast_24h_total_mm=forecast_base,
                soil_saturation_1h_ago=past_sat,
                fc_vwc=BASELINE_FC,
                sat_vwc=BASELINE_SAT,
                idf_24h_mm=IDF_24H_2YR_MM,
                max_sat=float(out["max_sat"]),
                risk_internal=float(out["risk_internal"]),
                risk_display=float(out["risk_display"]),
                risk_category=cat,
                base_soil_risk=float(out["base_soil_risk"]),
                storm_factor=float(out["storm_factor"]),
                site_sensitivity_factor=float(out["site_sensitivity_factor"]),
                delta_risk=float(out["risk_display"]) - float(base_out["risk_display"]),
                delta_base_soil_risk=float(out["base_soil_risk"]) - float(base_out["base_soil_risk"]),
                delta_storm_factor=float(out["storm_factor"]) - float(base_out["storm_factor"]),
                delta_site_sensitivity=float(out["site_sensitivity_factor"]) - float(base_out["site_sensitivity_factor"]),
                category_changed=(cat != base_cat),
                qc_failed=False,
                qc_used_fallback=bool(out["qc_used_fallback"]),
                qc_all_sensors_normal=bool(out["qc_all_sensors_normal"]),
            ))

    return rows


# ----------------------------
# Experiment 4: Rate-of-change sensitivity
# We vary soil_saturation_1h_ago to target different Δ = (current max_sat - past_sat).
# ----------------------------
def experiment_rate_of_change(
    *,
    seeds: Dict[str, Dict[str, Any]],
    rate_deltas: List[float],
) -> List[RateOfChangeRow]:
    rows: List[RateOfChangeRow] = []

    for regime, seed in seeds.items():
        cur = seed["current_samples"]
        prev = seed["previous_samples"]
        forecast_base = seed["forecast_24h_total_mm"]

        past_base = seed["soil_saturation_1h_ago"]
        qc_failed_base, base_out = run_one(
            current_samples=cur,
            previous_samples=prev,
            fc_vwc=BASELINE_FC,
            sat_vwc=BASELINE_SAT,
            soil_saturation_1h_ago=past_base,
            forecast_24h_total_mm=forecast_base,
            idf_24h_mm=IDF_24H_2YR_MM,
        )
        if qc_failed_base:
            raise RuntimeError(f"Baseline QC failed for ROC regime: {regime}")
        base_cat = risk_category(float(base_out["risk_display"]))

        current_max_sat = float(base_out["max_sat"])

        for rd in rate_deltas:
            past_sat = _clamp01(current_max_sat - float(rd))

            qc_failed, out = run_one(
                current_samples=cur,
                previous_samples=prev,
                fc_vwc=BASELINE_FC,
                sat_vwc=BASELINE_SAT,
                soil_saturation_1h_ago=past_sat,
                forecast_24h_total_mm=forecast_base,
                idf_24h_mm=IDF_24H_2YR_MM,
            )

            if qc_failed:
                rows.append(RateOfChangeRow(
                    risk_regime=regime,
                    moisture_profile=seed["moisture_profile"],
                    rate_delta=float(rd),
                    forecast_24h_total_mm=forecast_base,
                    soil_saturation_1h_ago=past_sat,
                    fc_vwc=BASELINE_FC,
                    sat_vwc=BASELINE_SAT,
                    idf_24h_mm=IDF_24H_2YR_MM,
                    max_sat=float("nan"),
                    risk_internal=float("nan"),
                    risk_display=float("nan"),
                    risk_category="QC_FAILED",
                    base_soil_risk=float("nan"),
                    storm_factor=float("nan"),
                    site_sensitivity_factor=float("nan"),
                    delta_risk=float("nan"),
                    delta_base_soil_risk=float("nan"),
                    delta_storm_factor=float("nan"),
                    delta_site_sensitivity=float("nan"),
                    category_changed=False,
                    qc_failed=True,
                    qc_used_fallback=False,
                    qc_all_sensors_normal=False,
                ))
                continue

            cat = risk_category(float(out["risk_display"]))
            rows.append(RateOfChangeRow(
                risk_regime=regime,
                moisture_profile=seed["moisture_profile"],
                rate_delta=float(rd),
                forecast_24h_total_mm=forecast_base,
                soil_saturation_1h_ago=past_sat,
                fc_vwc=BASELINE_FC,
                sat_vwc=BASELINE_SAT,
                idf_24h_mm=IDF_24H_2YR_MM,
                max_sat=float(out["max_sat"]),
                risk_internal=float(out["risk_internal"]),
                risk_display=float(out["risk_display"]),
                risk_category=cat,
                base_soil_risk=float(out["base_soil_risk"]),
                storm_factor=float(out["storm_factor"]),
                site_sensitivity_factor=float(out["site_sensitivity_factor"]),
                delta_risk=float(out["risk_display"]) - float(base_out["risk_display"]),
                delta_base_soil_risk=float(out["base_soil_risk"]) - float(base_out["base_soil_risk"]),
                delta_storm_factor=float(out["storm_factor"]) - float(base_out["storm_factor"]),
                delta_site_sensitivity=float(out["site_sensitivity_factor"]) - float(base_out["site_sensitivity_factor"]),
                category_changed=(cat != base_cat),
                qc_failed=False,
                qc_used_fallback=bool(out["qc_used_fallback"]),
                qc_all_sensors_normal=bool(out["qc_all_sensors_normal"]),
            ))

    return rows


def main(seed: int = 123) -> None:
    current_profiles, prev_profiles = build_profiles(seed=seed)

    seed_rows, seeds = find_seeds(
        current_profiles=current_profiles,
        prev_profiles=prev_profiles,
    )
    write_csv(seed_rows, "sens_regime_seeds_london_idf60_91_clay_loam.csv")
    print("Wrote regime seeds:", len(seed_rows))

    # 1) Soil misclassification (only allowed soil combos)
    soil_rows = experiment_soil_misclassification(seeds=seeds)
    write_csv(soil_rows, "sens_soil_misclassification_by_risk_regime.csv")
    print("Wrote soil misclassification rows:", len(soil_rows))

    # 2) Forecast depth sensitivity
    forecast_levels = [float(x) for x in range(0, 105, 5)]
    forecast_rows = experiment_forecast_depth(seeds=seeds, forecast_levels=forecast_levels)
    write_csv(forecast_rows, "sens_forecast_depth_by_risk_regime.csv")
    print("Wrote forecast sensitivity rows:", len(forecast_rows))

    # 3) Moisture bias sensitivity (sensor error)
    biases = [-0.05, -0.03, -0.02, -0.01, 0.0, 0.01, 0.02, 0.03, 0.05]
    moist_rows = experiment_moisture_bias(seeds=seeds, biases=biases)
    write_csv(moist_rows, "sens_moisture_bias_by_risk_regime.csv")
    print("Wrote moisture bias rows:", len(moist_rows))

    # 4) Rate-of-change sensitivity (via soil_saturation_1h_ago)
    rate_deltas = [-0.30, -0.20, -0.10, -0.05, -0.02, 0.0, 0.02, 0.05, 0.10, 0.20, 0.30]
    roc_rows = experiment_rate_of_change(seeds=seeds, rate_deltas=rate_deltas)
    write_csv(roc_rows, "sens_rate_of_change_by_risk_regime.csv")
    print("Wrote rate-of-change rows:", len(roc_rows))


if __name__ == "__main__":
    main(seed=123)
