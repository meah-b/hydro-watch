import numpy as np
import pytest
import pandas as pd

from src.utilities.forecast_extraction import get_24h_precip

class MockVariable:
    def __init__(self, values):
        self._values = values

    def ValuesAsNumpy(self):
        return np.array(self._values)


class MockHourly:
    def __init__(self, values, start_ts, interval_sec=3600):
        self._values = values
        self._start_ts = start_ts
        self._interval = interval_sec

    def Variables(self, idx):
        if idx != 0:
            return None
        return MockVariable(self._values)

    def Time(self):
        return self._start_ts

    def TimeEnd(self):
        return self._start_ts + len(self._values) * self._interval

    def Interval(self):
        return self._interval


class MockResponse:
    def __init__(self, hourly):
        self._hourly = hourly

    def Hourly(self):
        return self._hourly


class MockClient:
    def __init__(self, response):
        self._response = response

    def weather_api(self, url, params=None):
        return [self._response]
    

def test_get_24h_precip_happy_path(monkeypatch):
    values = [1.0] * 48  
    start_ts = int(pd.Timestamp("2025-01-01T00:00:00Z").timestamp())

    hourly = MockHourly(values, start_ts)
    response = MockResponse(hourly)
    client = MockClient(response)

    monkeypatch.setattr(
        "src.utilities.forecast_extraction.openmeteo_requests.Client",
        lambda: client
    )

    hourly_vals, total = get_24h_precip(43.0, -81.0)

    assert len(hourly_vals) == 24
    assert hourly_vals == [1.0] * 24
    assert total == 24.0


def test_get_24h_precip_time_windowing(monkeypatch):
    values = list(range(48))
    start_ts = int(pd.Timestamp("2025-01-01T06:00:00Z").timestamp())

    hourly = MockHourly(values, start_ts)
    response = MockResponse(hourly)
    client = MockClient(response)

    monkeypatch.setattr(
        "src.utilities.forecast_extraction.openmeteo_requests.Client",
        lambda: client
    )

    hourly_vals, total = get_24h_precip(43.0, -81.0)

    assert hourly_vals == list(range(24))
    assert total == sum(range(24))


def test_get_24h_precip_raises_if_hourly_missing(monkeypatch):
    response = MockResponse(hourly=None)
    client = MockClient(response)

    monkeypatch.setattr(
        "src.utilities.forecast_extraction.openmeteo_requests.Client",
        lambda: client
    )

    with pytest.raises(RuntimeError, match="Hourly data missing"):
        get_24h_precip(43.0, -81.0)


def test_get_24h_precip_raises_if_precip_variable_missing(monkeypatch):
    class BadHourly(MockHourly):
        def Variables(self, idx):
            return None

    values = [1.0] * 48
    start_ts = int(pd.Timestamp("2025-01-01T00:00:00Z").timestamp())

    hourly = BadHourly(values, start_ts)
    response = MockResponse(hourly)
    client = MockClient(response)

    monkeypatch.setattr(
        "src.utilities.forecast_extraction.openmeteo_requests.Client",
        lambda: client
    )

    with pytest.raises(RuntimeError, match="Precipitation variable missing"):
        get_24h_precip(43.0, -81.0)
