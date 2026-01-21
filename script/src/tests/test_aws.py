from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

import pytest
import boto3
from moto import mock_aws

from src.utilities.aws_storage import (
    AwsStorage,
    AwsTables,
    ddb_number_to_float,
    to_dynamo,
    from_ddb_resource,
    ddb_row_to_raw_payload,
)


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


def test_ddb_number_to_float_supports_decimal_and_lowlevel_and_native():
    assert ddb_number_to_float(Decimal("0.28")) == pytest.approx(0.28)
    assert ddb_number_to_float({"N": "1.5"}) == pytest.approx(1.5)
    assert ddb_number_to_float(2) == pytest.approx(2.0)
    assert ddb_number_to_float(3.25) == pytest.approx(3.25)

    with pytest.raises(TypeError):
        ddb_number_to_float({"S": "nope"})


def test_to_dynamo_converts_floats_recursively():
    payload = {
        "a": 1.25,
        "b": [0.1, 2, "x"],
        "c": {"d": 3.5},
        "e": True,
        "f": None,
    }
    out = to_dynamo(payload)

    assert isinstance(out["a"], Decimal)
    assert out["a"] == Decimal("1.25")
    assert isinstance(out["b"][0], Decimal)
    assert out["b"][1] == 2
    assert out["b"][2] == "x"
    assert isinstance(out["c"]["d"], Decimal)
    assert out["e"] is True
    assert out["f"] is None


def test_from_ddb_resource_converts_decimal_recursively():
    row = {"x": Decimal("0.5"), "y": [Decimal("1.0"), {"z": Decimal("2.25")}]}
    out = from_ddb_resource(row)
    assert out == {"x": 0.5, "y": [1.0, {"z": 2.25}]}


def test_ddb_row_to_raw_payload_maps_fields_and_converts_samples():
    row = {
        "timestamp_iso": "2025-01-01T00:00:00Z",
        "samples": {"front": Decimal("0.2")},
    }
    out = ddb_row_to_raw_payload(row)
    assert out["timestamp"] == "2025-01-01T00:00:00Z"
    assert out["samples"]["front"] == pytest.approx(0.2)


@mock_aws
def test_get_site_config_returns_or_raises():
    tables = AwsTables(
        latest_state="LatestSiteState_Test",
        moisture_history="MoistureHistory_Test",
        config="SiteConfig_Test",
        raw_data="RawSensorReadings_Test",
    )

    dynamodb = boto3.client("dynamodb", region_name=REGION)
    _create_tables(dynamodb, tables)

    store = AwsStorage(region=REGION, tables=tables)

    with pytest.raises(RuntimeError, match="No SiteConfig"):
        store.get_site_config("siteA")

    store.config_table.put_item(Item={"site_id": "siteA", "fc_vwc": Decimal("0.3")})
    cfg = store.get_site_config("siteA")
    assert cfg["site_id"] == "siteA"
    assert cfg["fc_vwc"] == Decimal("0.3")


@mock_aws
def test_get_sat_1h_ago_returns_zero_if_no_items():
    tables = AwsTables(
        latest_state="LatestSiteState_Test",
        moisture_history="MoistureHistory_Test",
        config="SiteConfig_Test",
        raw_data="RawSensorReadings_Test",
    )
    dynamodb = boto3.client("dynamodb", region_name=REGION)
    _create_tables(dynamodb, tables)

    store = AwsStorage(region=REGION, tables=tables)

    now = datetime(2025, 1, 1, 12, 0, tzinfo=timezone.utc)
    val = store.get_sat_1h_ago("siteA", _iso(now))
    assert val == pytest.approx(0.0)


@mock_aws
def test_get_sat_1h_ago_picks_latest_item_at_or_before_one_hour_ago():
    tables = AwsTables(
        latest_state="LatestSiteState_Test",
        moisture_history="MoistureHistory_Test",
        config="SiteConfig_Test",
        raw_data="RawSensorReadings_Test",
    )
    dynamodb = boto3.client("dynamodb", region_name=REGION)
    _create_tables(dynamodb, tables)

    store = AwsStorage(region=REGION, tables=tables)

    now = datetime(2025, 1, 1, 12, 0, tzinfo=timezone.utc)

    store.append_moisture_point("siteA", _iso(datetime(2025, 1, 1, 10, 45, tzinfo=timezone.utc)), 0.40)
    store.append_moisture_point("siteA", _iso(datetime(2025, 1, 1, 11, 30, tzinfo=timezone.utc)), 0.90)

    val = store.get_sat_1h_ago("siteA", _iso(now))
    assert val == pytest.approx(0.40)


@mock_aws
def test_get_latest_two_raw_payloads_requires_two_items_and_orders_latest_first():
    tables = AwsTables(
        latest_state="LatestSiteState_Test",
        moisture_history="MoistureHistory_Test",
        config="SiteConfig_Test",
        raw_data="RawSensorReadings_Test",
    )
    dynamodb = boto3.client("dynamodb", region_name=REGION)
    _create_tables(dynamodb, tables)

    store = AwsStorage(region=REGION, tables=tables)

    site_id = "siteA"
    t1 = _iso(datetime(2025, 1, 1, 12, 0, tzinfo=timezone.utc))
    t0 = _iso(datetime(2025, 1, 1, 11, 45, tzinfo=timezone.utc))

    store.put_raw_payload({"site_id": site_id, "timestamp_iso": t1, "samples": {"front": 0.2}})
    with pytest.raises(RuntimeError, match="Not enough raw sensor data"):
        store.get_latest_two_raw_payloads(site_id)

    store.put_raw_payload({"site_id": site_id, "timestamp_iso": t0, "samples": {"front": 0.1}})
    latest, previous = store.get_latest_two_raw_payloads(site_id)

    assert latest["timestamp_iso"] == t1
    assert previous["timestamp_iso"] == t0
    assert isinstance(latest["samples"]["front"], Decimal)
    assert float(latest["samples"]["front"]) == pytest.approx(0.2)


@mock_aws
def test_put_latest_state_writes_item():
    tables = AwsTables(
        latest_state="LatestSiteState_Test",
        moisture_history="MoistureHistory_Test",
        config="SiteConfig_Test",
        raw_data="RawSensorReadings_Test",
    )
    dynamodb = boto3.client("dynamodb", region_name=REGION)
    _create_tables(dynamodb, tables)

    store = AwsStorage(region=REGION, tables=tables)

    store.put_latest_state({"site_id": "siteA", "last_updated_iso": "2025-01-01T00:00:00Z", "risk": 55.5})

    resp = store.latest_table.get_item(Key={"site_id": "siteA"})
    item = resp.get("Item")
    assert item is not None
    assert item["last_updated_iso"] == "2025-01-01T00:00:00Z"
    assert isinstance(item["risk"], Decimal)
    assert float(item["risk"]) == pytest.approx(55.5)
