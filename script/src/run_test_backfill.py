import argparse
import hashlib
import math
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from src.utilities.aws_storage import AwsStorage
from src.main import run_pipeline

REGION = "us-east-1"


TARGETS = {
    "low": (0.0, 25.0),
    "mod": (25.0, 50.0),
    "high": (50.0, 75.0),
    "sev": (75.0, 100.0),
}


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def seed_int(*parts: str) -> int:
    h = hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()
    return int(h[:8], 16)


def rand01(seed: int, n: int) -> float:
    h = hashlib.sha256(f"{seed}|{n}".encode("utf-8")).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


def inv_norm_to_vwc(norm: float, fc: float, sat: float) -> float:
    fc_f = float(fc)
    sat_f = float(sat)
    return fc_f + float(norm) * (sat_f - fc_f)

def corrupt_samples(samples: List[Optional[float]]) -> List[Optional[float]]:
    return [None for _ in samples]

def risk_profile(risk: str) -> dict:
    if risk == "sev":
        return {"norm_center": 0.90, "norm_amp": 0.08, "trend": 0.03}
    if risk == "high":
        return {"norm_center": 0.65, "norm_amp": 0.08, "trend": 0.03}
    if risk == "mod":
        return {"norm_center": 0.35, "norm_amp": 0.07, "trend": 0.02}
    return {"norm_center": -0.12, "norm_amp": 0.06, "trend": 0.01} 


def make_side_samples(
    site_id: str,
    ts_iso: str,
    side: str,
    idx: int,
    base: float,
    span: float,
) -> List[Optional[float]]:
    s = seed_int(site_id, ts_iso, side, str(idx))
    out: List[Optional[float]] = []

    for k in range(5):
        if k == 0 and rand01(s, 100 + k) < 0.18:
            out.append(None)
            continue

        noise = (rand01(s, k) - 0.5) * (0.015 * span)
        v = base + noise
        out.append(round(v, 3))

    return out


def build_raw_item(
    site_id: str,
    ts_iso: str,
    idx: int,
    n_points: int,
    risk: str,
    fc: float,
    sat: float,
    center_offset: float = 0.0,
    demo: Optional[str] = None,
) -> Dict:
    prof = risk_profile(risk)

    frac = idx / max(1, (n_points - 1))
    norm = (
        (prof["norm_center"] + center_offset)
        + (prof["norm_amp"]*0.25) * math.sin(frac * math.pi)
        + (prof["trend"] * 0.25) * frac
    )

    hi = 1.15 if risk == "sev" else 1.0
    lo = -0.25 if risk == "low" else 0.0 
    norm = clamp(norm, lo, hi)


    span = max(1e-6, float(sat) - float(fc))
    base = inv_norm_to_vwc(norm, fc, sat)

    samples = {
        "front": make_side_samples(site_id, ts_iso, "front", idx, base, span),
        "back":  make_side_samples(site_id, ts_iso, "back",  idx, base,  span),
        "left":  make_side_samples(site_id, ts_iso, "left",  idx, base,  span),
        "right": make_side_samples(site_id, ts_iso, "right", idx, base, span),
    }

    if demo == "fallback":
        if idx == (n_points - 1):
            samples["left"] = corrupt_samples(samples["left"])

    elif demo == "failure":
        if idx >= (n_points - 2):
            for k in samples.keys():
                samples[k] = corrupt_samples(samples[k])


    return {
        "site_id": site_id,
        "timestamp_iso": ts_iso,
        "samples": samples,
        "source": "local_backfill",
    }


def write_raw_window(
    storage: AwsStorage,
    site_id: str,
    times: List[datetime],
    risk: str,
    fc: float,
    sat: float,
    center_offset: float,
    demo: Optional[str],
) -> None:
    for idx, dt in enumerate(times):
        ts_iso = iso(dt)
        item = build_raw_item(
            site_id, ts_iso, idx, len(times), risk, fc, sat,
            center_offset=center_offset,
            demo=demo,
        )
        storage.put_raw_payload(item)


def run_once_and_get_score(
    storage: AwsStorage,
    site_id: str,
    times: List[datetime],
    risk: str,
    fc: float,
    sat: float,
    center_offset: float,
) -> float:
    write_raw_window(storage, site_id, times, risk, fc, sat, center_offset,
                     demo=None)

    now_iso = iso(times[-1])
    run_pipeline(site_id=site_id, now_iso=now_iso)

    return storage.get_risk_score(site_id)


def calibrate_center_offset(
    storage: AwsStorage,
    site_id: str,
    times: List[datetime],
    risk: str,
    fc: float,
    sat: float,
    max_iters: int,
) -> float:
    lo_target, hi_target = TARGETS[risk]

    lo_off, hi_off = -0.40, 0.40
    best_off = 0.0

    for i in range(max_iters):
        mid = (lo_off + hi_off) / 2.0
        score = run_once_and_get_score(storage, site_id, times, risk, fc, sat, center_offset=mid)

        print(f"[cal] iter {i+1}/{max_iters} offset={mid:+.3f} -> score={score:.1f} target=[{lo_target},{hi_target})")

        if lo_target <= score < hi_target:
            return mid

        if score < lo_target:
            lo_off = mid
        else:
            hi_off = mid

        best_off = mid

    return best_off


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--site-id", required=True)
    parser.add_argument(
        "--risk",
        choices=["low", "mod", "high", "sev"],
        default="low",
        help="Controls how wet the generated raw readings are (affects downstream risk).",
    )
    parser.add_argument("--hours", type=int, default=6)
    parser.add_argument("--interval-min", type=int, default=15)
    parser.add_argument("--calibrate", action="store_true")
    parser.add_argument("--max-iters", type=int, default=8)
    parser.add_argument(
        "--demo",
        choices=["fallback", "failure"],
        default=None,
        help="Demo how fallback or failure scenarios affect the pipeline.",
    )

    args = parser.parse_args()

    site_id = args.site_id
    hours = args.hours
    interval = args.interval_min

    now_dt = datetime.now(timezone.utc)
    start_dt = now_dt - timedelta(hours=hours)
    prev_dt = start_dt - timedelta(minutes=interval)

    times: List[datetime] = []
    t = prev_dt
    while t <= now_dt:
        times.append(t)
        t += timedelta(minutes=interval)

    print(f"Site: {site_id}")
    print(f"Window: {iso(start_dt)} -> {iso(now_dt)} ({hours}h), interval {interval} min")
    print(f"Points (including prev): {len(times)}")

    storage = AwsStorage(region=REGION)

    cfg = storage.get_site_config(site_id)
    fc = float(cfg["fc_vwc"])
    sat = float(cfg["sat_vwc"])
    if sat <= fc:
        raise ValueError(f"Invalid config: sat_vwc ({sat}) must be > fc_vwc ({fc})")

    center_offset = 0.0
    if args.calibrate:
        center_offset = calibrate_center_offset(
            storage=storage,
            site_id=site_id,
            times=times,
            risk=args.risk,
            fc=fc,
            sat=sat,
            max_iters=args.max_iters,
        )
        print(f"[cal] chosen center_offset={center_offset:+.3f}")

    write_raw_window(storage, site_id, times, args.risk, fc, sat, center_offset=center_offset, demo=args.demo,)

    for dt in times[1:]:
        ts_iso = iso(dt)
        print(f"Running pipeline @ {ts_iso}")
        run_pipeline(site_id=site_id, now_iso=ts_iso)

    print("Done.")


if __name__ == "__main__":
    main()
