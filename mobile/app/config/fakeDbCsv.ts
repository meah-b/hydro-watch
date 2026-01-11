export const SITES_CSV = `
	site_id,location_label,lat,lon,soil_type,fc_vwc,sat_vwc,IDF_24h_2yr_mm,last_updated_iso,qc_all_sensors_normal,qc_used_fallback,sat_front,sat_back,sat_left,sat_right,sat_avg,forecast_24h_hourly_mm,forecast_24h_total_mm,base_soil_risk,storm_factor,site_sensitivity_factor,risk_score_internal,risk_score,qc_report
	site_001,"London, ON",42.9973110477211,-81.3101143606061,clay_loam,0.28,0.58,60.9,2026-01-11T00:00:00Z,true,false,0.33333333333333365,0.1250000000000001,0.4166666666666666,0.2500000000000002,0.2812500000000001,"[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.10000000149011612, 0.4000000059604645, 0.699999988079071, 0.10000000149011612, 0.0, 0.10000000149011612, 0.20000000298023224, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]",1.6,7.109375000000009,0.0,0.0,7.109375000000009,7.109375000000009,"{'all_sensors_present': True, 'all_sensors_normal': True, 'missing_sensors': [], 'fallback_sensors': [], 'failed_sensors': [], 'invalid_samples_removed': {'front': 1, 'back': 1, 'left': 0, 'right': 0}, 'valid_samples_kept': {'front': 4, 'back': 4, 'left': 5, 'right': 5}, 'used_fallback': False}"
`.trim();

export const MOISTURE_6H_CSV = `
	site_id,timestamp_iso,sat_avg
	site_001,2025-01-01T00:00:00Z,0.28125
	site_001,2025-01-01T00:15:00Z,0.28300
	site_001,2025-01-01T00:30:00Z,0.28420
	site_001,2025-01-01T00:45:00Z,0.28510
	site_001,2025-01-01T01:00:00Z,0.28650
	site_001,2025-01-01T01:15:00Z,0.28740
	site_001,2025-01-01T01:30:00Z,0.28810
	site_001,2025-01-01T01:45:00Z,0.28980
	site_001,2025-01-01T02:00:00Z,0.29120
	site_001,2025-01-01T02:15:00Z,0.29200
	site_001,2025-01-01T02:30:00Z,0.29360
	site_001,2025-01-01T02:45:00Z,0.29410
	site_001,2025-01-01T03:00:00Z,0.29530
	site_001,2025-01-01T03:15:00Z,0.29610
	site_001,2025-01-01T03:30:00Z,0.29780
	site_001,2025-01-01T03:45:00Z,0.29820
	site_001,2025-01-01T04:00:00Z,0.29950
	site_001,2025-01-01T04:15:00Z,0.30100
	site_001,2025-01-01T04:30:00Z,0.30230
	site_001,2025-01-01T04:45:00Z,0.30310
	site_001,2025-01-01T05:00:00Z,0.30460
	site_001,2025-01-01T05:15:00Z,0.30520
	site_001,2025-01-01T05:30:00Z,0.30680
	site_001,2025-01-01T05:45:00Z,0.30740
	site_001,2025-01-01T06:00:00Z,0.30900
`.trim();
