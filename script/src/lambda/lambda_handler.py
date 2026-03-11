from src.main import run_pipeline

def handler(event, context):
    site_id = event["site_id"]
    timestamp_iso = event.get("timestamp_iso")

    result = run_pipeline(site_id=site_id, now_iso=timestamp_iso)

    return {
        "ok": True,
        "site_id": site_id,
        "timestamp_iso": timestamp_iso,
        "result": result,
    }