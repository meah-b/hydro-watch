from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

import boto3
from moto import mock_aws

from src.utilities.aws_storage import AwsTables
import src.utilities.aws_storage as aws_storage
from src.main import run_pipeline

REGION = "us-east-1"


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _create_tables(dynamodb, tables: AwsTables):
    dynamodb.create_table(
        TableName=tables.latest_state,
        KeySchema=[{"AttributeName": "site_id", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "site_id", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )
    dynamodb.create_table(
        TableName=tables.moisture_history,
        KeySchema=[
            {"AttributeName": "site_id", "KeyType": "HASH"},
            {"AttributeName": "timestamp_iso", "KeyType": "RANGE"},
        ],
        AttributeDefinitions=[
            {"AttributeName": "site_id", "AttributeType": "S"},
            {"AttributeName": "timestamp_iso", "AttributeType": "S"},
        ],
        BillingMode="PAY_PER_REQUEST",
    )
    dynamodb.create_table(
        TableName=tables.config,
        KeySchema=[{"AttributeName": "site_id", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "site_id", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )
    dynamodb.create_table(
        TableName=tables.raw_data,
        KeySchema=[
            {"AttributeName": "site_id", "KeyType": "HASH"},
            {"AttributeName": "timestamp_iso", "KeyType": "RANGE"},
        ],
        AttributeDefinitions=[
            {"AttributeName": "site_id", "AttributeType": "S"},
            {"AttributeName": "timestamp_iso", "AttributeType": "S"},
        ],
        BillingMode="PAY_PER_REQUEST",
    )


@mock_aws
def test_run_pipeline_end_to_end_writes_latest_state_and_history(monkeypatch):
    tables = AwsTables(
        latest_state="LatestSiteState_Test",
        moisture_history="MoistureHistory_Test",
        config="SiteConfig_Test",
        raw_data="RawSensorReadings_Test",
    )

    dynamodb = boto3.client("dynamodb", region_name=REGION)
    _create_tables(dynamodb, tables)

    real_init = aws_storage.AwsStorage.__init__

    def init_with_test_tables(self, region: str, tables_param=None):
        return real_init(self, region=region, tables=tables)

    monkeypatch.setattr(aws_storage.AwsStorage, "__init__", init_with_test_tables)

    def fake_get_24h_precip(lat: float, lon: float):
        return [1.0] * 24, 24.0

    monkeypatch.setattr("src.main.get_24h_precip", fake_get_24h_precip)

    site_id = "siteA"
    now = datetime.now(timezone.utc)
    now_iso = _iso(now)

    latest_payload_ts = _iso(now - timedelta(minutes=5))
    prev_payload_ts = _iso(now - timedelta(minutes=20))

    cfg_table = boto3.resource("dynamodb", region_name=REGION).Table(tables.config)
    cfg_table.put_item(
        Item={
            "site_id": site_id,
            "lat": Decimal("43.0"),
            "lon": Decimal("-81.0"),
            "fc_vwc": Decimal("0.30"),
            "sat_vwc": Decimal("0.50"),
            "idf_24h_2yr_mm": Decimal("100.0"),
        }
    )

    raw_table = boto3.resource("dynamodb", region_name=REGION).Table(tables.raw_data)
    raw_table.put_item(
        Item={
            "site_id": site_id,
            "timestamp_iso": latest_payload_ts,
            "samples": {
                "front": [Decimal("0.35"), Decimal("0.36"), Decimal("0.34")],
                "back": [Decimal("0.33"), Decimal("0.33"), Decimal("0.33")],
                "left": [Decimal("0.31"), Decimal("0.30"), Decimal("0.32")],
                "right": [Decimal("0.34"), Decimal("0.34"), Decimal("0.34")],
            },
        }
    )
    raw_table.put_item(
        Item={
            "site_id": site_id,
            "timestamp_iso": prev_payload_ts,
            "samples": {
                "front": [Decimal("0.34"), Decimal("0.34"), Decimal("0.34")],
                "back": [Decimal("0.32"), Decimal("0.32"), Decimal("0.32")],
                "left": [Decimal("0.30"), Decimal("0.30"), Decimal("0.30")],
                "right": [Decimal("0.33"), Decimal("0.33"), Decimal("0.33")],
            },
        }
    )

    hist_table = boto3.resource("dynamodb", region_name=REGION).Table(tables.moisture_history)
    hist_table.put_item(
        Item={
            "site_id": site_id,
            "timestamp_iso": _iso(now - timedelta(hours=2)),
            "max_sat": Decimal("0.50"),
        }
    )

    run_pipeline(site_id=site_id, now_iso=now_iso)

    latest_table = boto3.resource("dynamodb", region_name=REGION).Table(tables.latest_state)
    resp = latest_table.get_item(Key={"site_id": site_id})
    item = resp.get("Item")
    assert item is not None

    assert item["site_id"] == site_id
    assert item["last_updated_iso"] == now_iso

    assert "qc_report" in item
    assert "qc_all_sensors_normal" in item

    assert item["forecast_24h_total_mm"] == Decimal("24.0")
    hourly = item.get("forecast_24h_hourly_mm")
    assert isinstance(hourly, list)
    assert len(hourly) == 24

    assert "risk_score" in item
    assert isinstance(item["risk_score"], Decimal)
    assert 0.0 <= float(item["risk_score"]) <= 100.0

    resp2 = hist_table.get_item(Key={"site_id": site_id, "timestamp_iso": now_iso})
    appended = resp2.get("Item")
    assert appended is not None
    assert appended["site_id"] == site_id
    assert isinstance(appended["max_sat"], Decimal)
