from datetime import datetime, timezone
from utilities.runtime_harness import run_pipeline_timed, save_report

def test_runtime_one_cycle():
    site_id = "d4286488-c041-708f-939f-27d6734472e8"
    now_iso = datetime.now(timezone.utc).isoformat()

    report = run_pipeline_timed(site_id, now_iso)

    assert report.total_ms > 0
    assert "compute_risk_score" in report.stages_ms

    save_report(report, "runtime_report.json")
