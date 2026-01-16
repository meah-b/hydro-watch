import argparse
import hashlib
import math
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from src.aws_storage import AwsStorage
from src.main import run_pipeline 

REGION = "us-east-1"


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_iso(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(timezone.utc)


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def seed_int(*parts: str) -> int:
    h = hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()
    return int(h[:8], 16)


def rand01(seed: int, n: int) -> float:
    h = hashlib.sha256(f"{seed}|{n}".encode("utf-8")).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


def make_side_samples(site_id: str, ts_iso: str, side: str, idx: int, base: float) -> List[Optional[float]]:
    """
    Returns 5 samples like your Dynamo example:
      [NULL?, number, number, number, number]
    """
    s = seed_int(site_id, ts_iso, side, str(idx))
    out: List[Optional[float]] = []
    for k in range(5):
        # 18% chance first sample is None
        if k == 0 and rand01(s, 100 + k) < 0.18:
            out.append(None)
            continue

        noise = (rand01(s, k) - 0.5) * 0.10  # +/- 0.05
        v = base + noise
        out.append(round(v, 3))
    return out


def build_raw_item(site_id: str, ts_iso: str, idx: int) -> Dict:
    """
    Builds one RawSensorReadings item:
      {
        site_id,
        timestamp_iso,
        samples: { front: [..], back: [..], left: [..], right: [..] }
      }
    """
    frac = idx / 24.0  # approx in 6h window
    base = 0.25 + 0.25 * math.sin(frac * math.pi) + 0.10 * frac
    base = clamp01(base)

    front_base = clamp01(base + 0.05 * math.sin(idx / 3.0))
    back_base  = clamp01(base + 0.04 * math.cos(idx / 3.5))
    left_base  = clamp01(base + 0.03 * math.sin(idx / 4.0 + 1.0))
    right_base = clamp01(base + 0.02 * math.cos(idx / 4.0 + 1.2))

    return {
        "site_id": site_id,
        "timestamp_iso": ts_iso,
        "samples": {
            "front": make_side_samples(site_id, ts_iso, "front", idx, front_base),
            "back":  make_side_samples(site_id, ts_iso, "back",  idx, back_base),
            "left":  make_side_samples(site_id, ts_iso, "left",  idx, left_base),
            "right": make_side_samples(site_id, ts_iso, "right", idx, right_base),
        },
        "source": "local_backfill",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--site-id", required=True)
    parser.add_argument("--hours", type=int, default=6)
    parser.add_argument("--interval-min", type=int, default=15)
    parser.add_argument("--now-iso", default=None, help="Override 'now' (UTC ISO like 2026-01-15T19:30:00Z)")
    parser.add_argument("--dry-run", action="store_true", help="Generate timestamps and raw items, but do not write or run pipeline")
    args = parser.parse_args()

    site_id = args.site_id
    hours = args.hours
    interval = args.interval_min

    now_dt = parse_iso(args.now_iso) if args.now_iso else datetime.now(timezone.utc)

    start_dt = now_dt - timedelta(hours=hours)
    # Include one extra earlier point so your pipeline can fetch "previous" reading cleanly
    prev_dt = start_dt - timedelta(minutes=interval)

    times = []
    t = prev_dt
    while t <= now_dt:
        times.append(t)
        t += timedelta(minutes=interval)

    print(f"Site: {site_id}")
    print(f"Window: {iso(start_dt)} -> {iso(now_dt)} ({hours}h), interval {interval} min")
    print(f"Points (including prev): {len(times)}")

    if args.dry_run:
        for idx, dt in enumerate(times):
            ts_iso = iso(dt)
            item = build_raw_item(site_id, ts_iso, idx)
            print(ts_iso, "front0=", item["samples"]["front"][0])
        return

    storage = AwsStorage(region=REGION)

    # 1) Write all raw readings first (so your "get_latest_two_raw_payloads_at" has something to query)
    for idx, dt in enumerate(times):
        ts_iso = iso(dt)
        item = build_raw_item(site_id, ts_iso, idx)

        # You need a method that writes raw payloads.
        # If you don't have it yet, add one in AwsStorage (example below).
        storage.put_raw_payload(item)
        print(f"Wrote RawSensorReadings @ {ts_iso}")

    # 2) Run pipeline for each real point (skip the prev point at index 0)
    for idx, dt in enumerate(times[1:], start=1):
        ts_iso = iso(dt)
        print(f"Running pipeline @ {ts_iso}")
        run_pipeline(site_id=site_id, now_iso=ts_iso)

    print("Done.")


if __name__ == "__main__":
    main()
