import type { SiteState } from '@/config/types';

export function makeSiteState(overrides: Partial<SiteState> = {}): SiteState {
	return {
		risk_score: 50,
		max_sat: 0.4,
		sat_front: 0.4,
		sat_back: 0.4,
		sat_left: 0.4,
		sat_right: 0.4,
		forecast_24h_total_mm: 10,
		forecast_24h_hourly_mm: Array(24).fill(0),
		last_updated_iso: '2026-01-20T12:00:00Z',
		base_soil_risk: 0.4,
		site_sensitivity_factor: 0.4,
		storm_factor: 0.4,

		qc_report: {
			all_sensors_normal: true,
			used_fallback: false,
			missing_sensors: [],
			fallback_sensors: [],
			failed_sensors: [],
		},

		...overrides,
	} as SiteState;
}
