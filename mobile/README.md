# HydroWatch Mobile App

The HydroWatch mobile app is a **React Native (Expo)** application that surfaces localized flood-risk insights for individual homes. It connects to the HydroWatch backend to display real-time soil moisture conditions, rainfall context, and an interpretable flood-risk score.

The app is designed to be:
- Clear for non-technical users
- Transparent about *why* risk is elevated
- Able to handle partial data or temporary backend failures

---

## 📱 App Overview

The app consists of:
- An **onboarding flow** for authentication and setup
- Three primary data-driven screens:
  - **Home**
  - **Insights**
  - **Risk**
- Lightweight **Settings** and **Notifications** screens

All core screens support pull-to-refresh and explicitly handle loading and error states.

---

## 🚀 Onboarding & Authentication

### Login / Signup
Users authenticate using an email + password flow. The app supports:
- Account creation (Sign Up)
- Login with existing credentials
- Forced password reset flows when required by the backend

Authentication state is used to securely fetch site-specific data from the API.

### Onboarding: Site Configuration

After authentication, users complete a **one-time onboarding flow** to configure their monitoring site. This step is required before any flood-risk data can be displayed.

#### 1. Site Location Selection
- The app requests foreground location permission to center the map near the user.
- Users place a pin on a map to indicate the **physical location of the sensor site**.
- A readable location label is generated via reverse geocoding.
- Latitude and longitude are stored precisely for downstream climate calculations.

This location is later used to:
- Fetch local rainfall forecasts
- Extract the site-specific 24-hour IDF reference depth

#### 2. Soil Type Selection
Users select the dominant soil type around their foundation from a predefined list (e.g., loam, clay loam, sandy loam).

The selected soil type is used to derive:
- **Field capacity (FC)**
- **Saturation threshold (SAT)**

These parameters control how raw soil moisture readings are normalized and interpreted by the risk model.

#### 3. Configuration Save
When the user saves:
- Location (lat/lon + label)
- Soil type
- Derived soil parameters (FC, SAT)
- Local 24-hour IDF depth

are persisted to the backend as the site configuration.

Once saved, the user is routed into the main app experience and does not need to repeat onboarding unless the site configuration changes.

---

## 🏠 Home Screen (Overview)

The **Home screen** is the primary snapshot view of the system’s current state.

### What it shows
- **Flood Risk (LOW / MODERATE / HIGH / SEVERE)**  
  A categorical summary derived from the numeric risk score.
- **Soil Moisture**
  Displays the maximum site saturation as a percentage.
- **Site Symmetry**
  Describes how evenly moisture is distributed around the foundation.
- **Precipitation Forecast**
  A 24-hour rainfall preview with hourly breakdown.
- **Sensor Status**
  Readable health summary based on QC reports.
- **Last Updated Timestamp**

### Behavior
- Pull-to-refresh re-fetches the latest site state
- Tapping cards navigates to deeper context:
  - Flood Risk → Risk screen
  - Soil Moisture / Symmetry / Rain → Insights screen (scrolled to section)

The Home screen is intentionally concise, acting as a “dashboard” rather than an analysis view.

---

## ⚠️ Risk Screen (Interpretation)

The **Risk screen** is dedicated to explaining the flood-risk score transparently.

### What it shows
- Large risk gauge with categorical labels
- Rounded numeric risk score (0–100)
- A plain-language description of the current risk level

### Risk Drivers
Below the gauge, the app lists the **three contributing factors**:
- Base soil moisture
- Site sensitivity (recent change)
- Storm severity

Each factor is labelled with an influence level (Low / Moderate / High) and accompanied by a short explanation. This makes the model’s behaviour understandable rather than opaque.

---

## 📊 Insights Screen (Context & Trends)

The **Insights screen** explains *why* conditions look the way they do by breaking data into three focused sections.

### 1. Foundation Moisture
- Visual map of the four sensors (front, back, left, right)
- Each side shows:
  - Moisture percentage
  - Severity classification (Normal / Elevated / High)
- An average moisture value is displayed
- A symmetry label (Low / Moderate / High) is computed from side-to-side variation
- Contextual text explains what the symmetry means in practice

### 2. Soil Moisture Trend
- Line + area chart showing the **last 6 hours** of moisture history
- Summary stats:
  - 6-hour change
  - Peak moisture value
- Reference lines for field capacity (FC) and saturation (SAT)

The trend section emphasizes *rate of change*, not just absolute wetness.

### 3. Rain Intensity Context
- Bar chart comparing:
  - Forecast 24-hour rainfall
  - Local 24-hour, 2-year IDF reference depth
- Explicitly framed as **context**, not prediction
- Helps users understand whether an upcoming storm is typical or unusually severe for their location

### Navigation
The Insights screen supports deep-linking from the Home screen, automatically scrolling to the relevant section.

---

## 🔔 Notifications

The Notifications screen provides a placeholder for alert-related controls. It is intended to support:
- Flood-risk escalation alerts
- System or sensor status notifications

At present, it serves as a navigational endpoint and UI stub.

---

## ⚙️ Settings

The Settings screen provides access to:
- Account-related actions
- App-level configuration options

Like Notifications, it is intentionally lightweight and separated from the core monitoring experience.

---

## 🧪 Testing & Reliability

The mobile app includes a comprehensive test suite covering:
- Home, Insights, and Risk screens
- Loading and error states
- Pull-to-refresh behavior
- Navigation between screens
- Correct mapping of backend data to UI labels

Mocked components are used to isolate logic and ensure deterministic behaviour.

---

## 🛠 Tech Stack

- **React Native (Expo)**
- **TypeScript**
- **expo-router** for navigation
- **AWS-backed REST API**
- **Jest + @testing-library/react-native** for testing
- **SVG-based custom charts** for data visualization

---

## 📌 Design Philosophy

The app prioritizes:
- Interpretability over raw numbers
- Safe failure when data is missing or delayed
- Consistent mental models across screens
- Clear separation between “overview” and “analysis"

The result is a mobile interface that supports both quick checks and deeper understanding without overwhelming the user.
