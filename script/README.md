# Flood-Risk Pipeline

This project implements a **home-scale flood-risk estimation pipeline** that combines soil-moisture sensing, short-term weather forecasts, local rainfall statistics, and soil response behaviour to produce a homeowner-facing flood-risk score.

The system is designed to operate continuously at **15-minute resolution**, ingesting raw sensor readings, performing quality control and normalization, and storing processed state in AWS for consumption by the mobile application.

---

## 🌧️ Project Overview

Most flood models operate at the watershed or municipal scale. This project focuses on **foundation-level risk**, using local sensors and climate context to answer a simpler question:

> Given how wet the soil is right now and what rain is coming next, how likely is basement seepage or foundation water ingress?
> The pipeline integrates five core elements.

---

## 1. Soil Moisture Sensors (x4)

Four sensors placed around the foundation:

- front
- back
- left
- right

Each sensor reports multiple raw samples per interval (fractional VWC, ~0–1).

### Quality Control

Implemented in `quality_control.py`:

- Invalid samples removed (NaN, None, out-of-range, non-numeric)
- Median taken across valid samples per sensor
- Automatic fallback to the **previous valid reading** if a sensor batch fully fails
- Explicit failure if a sensor has no valid data and no fallback available
- Timestamp validation (rejects stale or future data)

QC outputs both the cleaned values and a structured `qc_report` that describes what occurred.

---

## 2. Soil Normalization

Raw VWC values are converted into a **normalized saturation index** using site-specific soil parameters:
`S = (VWC − FC) / (SAT − FC)`
Where:

- FC = field capacity
- SAT = saturation threshold

Implemented in `normalization.py`.

Values are intentionally **not clamped** so the risk model can reason about extremely dry or over-saturated conditions.

---

## 3. 24-Hour Rainfall Forecast

The next 24 hours of precipitation are pulled from the [Open-Meteo GEM seamless model](https://open-meteo.com/en/docs/gem-api) using site latitude and longitude.

Implemented in `forecast_extraction.py`:

- Hourly precipitation retrieved
- First 24 hours windowed explicitly
- Both hourly series and 24-hour total returned
- Error handling for malformed API responses

---

## 4. Local Rainfall Context (IDF)

Each site is configured with a **24-hour, 2-year IDF depth** (mm), representing a typical design-storm baseline for the location.

Forecast rainfall is evaluated **relative to local climate**, rather than using raw depth alone. This allows storm severity to be interpreted consistently across regions.

This value is stored in site configuration and used directly by the risk model.

---

## 5. Flood-Risk Model

Implemented in `risk_model.py`, composed of three interpretable components.

### a) Soil Saturation Component (0–100)

Maps normalized soil saturation to a base risk score.

- Very dry soil → zero risk
- Gradual increase through typical wet range
- Accelerated growth near and above saturation

### b) Storm Severity Factor (0–1.5)

Computed as:
`forecast_24h_mm / IDF_24h_2yr_mm`
Mapped piecewise so that:

- Small storms add negligible risk
- Typical design storms add moderate amplification
- Severe storms increase amplification but are capped

### c) Site Sensitivity Factor (0–1)

Measures how fast soil saturation has increased in the last hour:
`ΔS = max(0, S_now − S_1h_ago)`
This captures how reactive the site is during the current event.

### Final Combination

`RiskInternal = BaseSoilRisk × (1 + SiteSensitivity × StormSeverity)`

`RiskDisplayed = clamp(RiskInternal, 0–100)`

The internal score may exceed 100 under extreme conditions, but the displayed score is clamped for user clarity.

---

## 🧠 System Pipeline

Implemented in `main.py` via `run_pipeline()`:

1. Load site configuration from DynamoDB
2. Fetch the two most recent raw sensor payloads
3. Apply QC and median smoothing
4. Normalize moisture values
5. Fetch 24-hour rainfall forecast
6. Compute risk components and final score
7. Write:
   - LatestSiteState (current risk snapshot)
   - MoistureHistory (time-series trend point)

All numeric values are converted to DynamoDB-safe formats.

---

## ☁️ AWS Storage Layer

Implemented in `aws_storage.py` using DynamoDB tables:

- RawSensorReadings
- LatestSiteState
- MoistureHistory
- SiteConfig

Includes:

- Recursive float → Decimal conversion
- DynamoDB number parsing
- Time-based queries for historical state
- Clean separation between raw and derived data

---

## 🔁 Local Backfill and Simulation

The script `run_test_backfill.py` generates **synthetic raw sensor data** for realistic testing and demos.

Features:

- Configurable time window and interval
- Deterministic generation via hashing
- Risk profiles (low, mod, high, sev) controlling baseline wetness
- Automatic pipeline execution for each generated timestamp

This enables full end-to-end testing **without live hardware**.

---

## 🧪 Testing Strategy

The project includes a comprehensive test suite using `pytest` and `moto`:

- Unit tests for:
  - Quality control
  - Normalization
  - Each risk component
- Golden-case tests for known scenarios
- Monotonicity and bounds tests
- Full end-to-end pipeline tests with mocked AWS and weather APIs
- AWS storage behavior tests (ordering, conversions, edge cases)

This ensures the model is stable, explainable, and repeatable.

---

## 📱 Mobile App Integration

The pipeline is designed to serve a mobile application that:

- Displays current flood-risk level
- Shows recent soil-moisture trends
- Surfaces forecast rainfall context
- Explains why risk is elevated using component breakdowns

The backend provides structured, app-ready data.

---

## 🏗️ Installation

```bash
git clone https://github.com/meah-b/hydro-watch
cd hydro-watch/script
pip install -r requirements.txt
```

---

## ▶️ Running the Pipeline

```bash
python -m src.main --site-id <SITE_ID>
```

Optional local backfill:

```bash
python -m src.run_test_backfill --site-id <SITE_ID> --risk <RISK_LEVEL>
```
