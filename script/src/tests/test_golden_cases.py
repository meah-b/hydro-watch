from __future__ import annotations

import json
from pathlib import Path
import pytest

from src.utilities.risk_model import compute_risk_score


def test_golden_cases_match_expected_displayed():
    path = Path(__file__).with_name("golden_cases.json")
    cases = json.loads(path.read_text(encoding="utf-8"))

    for c in cases:
        _, displayed, *_ = compute_risk_score(
            c["S_now"],
            c["S_1h_ago"],
            c["forecast_24h_mm"],
            c["idf_24h_2yr_mm"],
        )
        assert displayed == pytest.approx(
            c["expected_displayed"], abs=1e-6
        ), c["name"]
