# HydroWatch

HydroWatch is a capstone project that explores **home-scale flood risk monitoring** using local soil-moisture sensing, short-term weather forecasts, and site-specific soil and climate context.

The goal of the project is to move beyond watershed-level flood warnings and instead provide **foundation-level insight** for individual homes, helping homeowners understand *when and why* basement seepage or water ingress risk is increasing.

The system is split into two tightly coupled parts:
1. A **data processing and risk-modelling pipeline**
2. A **mobile application** that presents the results in an interpretable, homeowner-friendly way

---

## 🌧️ What the System Does

At a high level, HydroWatch:
- Reads soil-moisture data from four sensors placed around a home’s foundation
- Normalizes readings based on soil type
- Incorporates 24-hour rainfall forecasts and local IDF references
- Computes a flood-risk score and supporting context
- Surfaces the results through a mobile app with clear explanations

The emphasis throughout the project is on **interpretability, reliability, and transparency**, rather than black-box prediction.

---

## 🧠 Backend Script (Data & Risk Pipeline)

The backend component is a Python-based pipeline responsible for:
- Quality-controlling raw sensor readings
- Normalizing moisture using soil parameters
- Fetching short-term rainfall forecasts
- Applying a multi-factor flood-risk model
- Writing processed state and history to AWS

It also includes tooling for **local backfilling and simulation**, allowing the entire system to be demonstrated without live hardware.

📄 **Detailed documentation:**  
See [`script/README.md`](./script/README.md) for:
- Pipeline architecture
- Risk model formulation
- Data storage layout
- Testing strategy

---

## 📱 Mobile App

The mobile app is built with **React Native (Expo)** and serves as the primary user interface for HydroWatch.

It allows users to:
- Configure their site location and soil type during onboarding
- View a high-level flood-risk overview
- Explore soil moisture trends and rainfall context
- Understand *why* risk is elevated through interpretable drivers

The app is structured around three main screens:
- **Home** (overview)
- **Risk** (interpretation and drivers)
- **Insights** (context and trends)

📄 **Detailed documentation:**  
See [`mobile/README.md`](./mobile/README.md) for:
- Screen-by-screen behavior
- Onboarding flow
- UI components and charts
- Testing coverage

---

## 🧪 Testing & Reliability

Both the backend pipeline and mobile app include automated test suites:
- Unit tests for core logic
- End-to-end tests for full workflows
- Defensive handling of missing or partial data

This ensures the system behaves predictably under realistic conditions and failure modes.

---

## 🎓 Project Context

HydroWatch was developed as an integrated engineering capstone project with an emphasis on:
- Applied environmental sensing
- Data-driven risk assessment
- Human-centred system design
- Clear communication of uncertainty and context

The project prioritizes **explainability over raw prediction accuracy**, reflecting real-world requirements for homeowner-facing risk tools.

---

## 📂 Repository Structure

```text
/
├── script/        # Backend data pipeline and risk model
│   └── README.md  # Detailed pipeline documentation
├── mobile/        # React Native mobile application
│   └── README.md  # Detailed app documentation
└── README.md      # This file (project overview)
