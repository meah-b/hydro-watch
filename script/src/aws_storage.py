
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Any, Dict, Mapping, Tuple
import boto3
from boto3.dynamodb.conditions import Key


def _to_decimal(x: float) -> Decimal:
    return Decimal(str(x))

def ddb_number_to_float(attr: Any) -> float:
    """
    Convert a low-level DynamoDB attribute value (e.g. {"N": "0.28"}) into float.
    Raises with a clear message if the shape is unexpected.
    """
    if not isinstance(attr, Mapping):
        raise TypeError(f"Expected DynamoDB attribute map like {{'N': '...'}}, got {type(attr)}")

    n = attr.get("N")
    if n is None:
        raise TypeError(f"Expected DynamoDB Number attr with key 'N', got: {attr}")

    return float(n)

def to_dynamo(value: Any) -> Any:
    """
    Recursively convert Python values into DynamoDB-safe types.

    DynamoDB (via boto3) expects numbers as Decimal, not float.
    This also converts:
      - list/tuple -> list
      - dict -> dict
    """
    if isinstance(value, float):
        return _to_decimal(value)
    if isinstance(value, int) or isinstance(value, str) or isinstance(value, bool) or value is None:
        return value
    if isinstance(value, Decimal):
        return value
    try:
        import numpy as np
        if isinstance(value, (np.floating,)):
            return _to_decimal(float(value))
        if isinstance(value, (np.integer,)):
            return int(value)
        if isinstance(value, (np.bool_,)):
            return bool(value)
    except Exception:
        pass

    if isinstance(value, dict):
        return {str(k): to_dynamo(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [to_dynamo(v) for v in value]
    return value


def from_ddb_resource(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, list):
        return [from_ddb_resource(v) for v in value]
    if isinstance(value, dict):
        return {k: from_ddb_resource(v) for k, v in value.items()}
    return value

def ddb_row_to_raw_payload(row: dict) -> dict:
    return {
        "timestamp": row["timestamp_iso"],    
        "samples": from_ddb_resource(row["samples"])  
    }


@dataclass(frozen=True)
class AwsTables:
    latest_state: str = "LatestSiteState"
    moisture_history: str = "MoistureHistory"
    config: str = "SiteConfig"
    raw_data: str = "RawSensorReadings"


class AwsStorage:
    def __init__(self, region: str, tables: AwsTables = AwsTables()):
        self.region = region
        self.dynamodb = boto3.resource("dynamodb", region_name=region)
        self.latest_table = self.dynamodb.Table(tables.latest_state)
        self.history_table = self.dynamodb.Table(tables.moisture_history)
        self.config_table = self.dynamodb.Table(tables.config)
        self.raw_table = self.dynamodb.Table(tables.raw_data)

    def put_latest_state(self, item: Dict[str, Any]) -> Mapping[str, Any]:
        """
        Overwrite latest state for a site.

        REQUIRED keys in item:
          - site_id: str
          - last_updated_iso: str (ISO-8601)
        """
        return self.latest_table.put_item(Item=to_dynamo(dict(item)))

    def append_moisture_point(self, site_id: str, timestamp_iso: str, sat_avg: float) -> Mapping[str, Any]:
        """
        Append one 15-minute moisture point for trend charts.
        """
        return self.history_table.put_item(
            Item=to_dynamo(
                {
                    "site_id": site_id,
                    "timestamp_iso": timestamp_iso,
                    "sat_avg": sat_avg,
                }
            )
        )
    
    def get_site_config(self, site_id: str) -> dict:
        resp = self.config_table.get_item(Key={"site_id": site_id})
        if "Item" not in resp:
            raise RuntimeError(f"No SiteConfig for {site_id}")
        return resp["Item"]
    
    def get_sat_avg_1h_ago(self, site_id: str) -> float:
        one_hour_ago = (
            datetime.now(timezone.utc) - timedelta(hours=1)
        ).isoformat().replace("+00:00", "Z")

        resp = self.history_table.query(
            KeyConditionExpression=Key("site_id").eq(site_id) 
            & Key("timestamp_iso").lte(one_hour_ago),
            ScanIndexForward=False,
            Limit=1,
        )

        item = resp["Items"][0]
        if not item:
            raise RuntimeError("No moisture history available for 1h-ago lookup")

        return ddb_number_to_float(item["sat_avg"])
    
    def get_latest_two_raw_payloads(self, site_id: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        resp = self.raw_table.query(
            KeyConditionExpression=Key("site_id").eq(site_id),
            ScanIndexForward=False,
            Limit=2
        )

        items = resp.get("Items", [])
        if len(items) < 2:
            raise RuntimeError("Not enough raw sensor data to get previous reading")

        latest = items[0]
        previous = items[1]

        return latest, previous