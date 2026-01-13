import type { DriverItem, Influence, RiskLevel } from '@/config/types';
import type { FakeDbRow } from './fakeDbParse';
import { asNumber } from './fakeDbTypes';

export function getRiskScore(row: FakeDbRow): number {
	const score = asNumber(row.risk_score);
	return Number(score.toFixed(0));
}

export function getRiskLevel(score: number): RiskLevel {
	if (score < 30.0) {
		return 'Low';
	} else if (score < 60.0) {
		return 'Moderate';
	} else if (score < 80.0) {
		return 'High';
	} else {
		return 'Severe';
	}
}

/**
 * Soil influence from normalized saturation average (0..1).
 */
export function getSoilMoistureInfluence(row: FakeDbRow): Influence {
	const satAvg = asNumber(row.sat_avg);

	if (!Number.isFinite(satAvg)) return 'Low';

	// Stub thresholds (tweak later)
	if (satAvg >= 0.6) return 'High';
	if (satAvg >= 0.3) return 'Moderate';
	return 'Low';
}

/**
 * Forecast influence from total 24h precipitation vs IDF 24h depth.
 * Uses data already in the script output.
 */
export function getForecastedRainfallInfluence(row: FakeDbRow): Influence {
	const total = asNumber(row.forecast_24h_total_mm);
	const idf = asNumber(row.IDF_24h_2yr_mm);

	if (!Number.isFinite(total) || !Number.isFinite(idf) || idf <= 0)
		return 'Low';

	const ratio = total / idf;

	// Mirrors the shape of your storm-severity component, but as a coarse label.
	if (ratio >= 0.8) return 'High';
	if (ratio >= 0.3) return 'Moderate';
	return 'Low';
}

/**
 * Site sensitivity influence from the script output factor.
 * (Right now your factor is 0..1-ish; this is a simple bucket.)
 */
export function getSiteSensitivityInfluence(row: FakeDbRow): Influence {
	const f = asNumber(row.site_sensitivity_factor);

	if (!Number.isFinite(f)) return 'Low';

	if (f >= 0.5) return 'High';
	if (f > 0.0) return 'Moderate';
	return 'Low';
}

/**
 * Convenience: build the driver list the Risk screen expects.
 */
export function buildRiskDrivers(row: FakeDbRow): DriverItem[] {
	return [
		{
			key: 'soilMoisture',
			title: 'Soil Moisture',
			value: getSoilMoistureInfluence(row),
		},
		{
			key: 'siteSensitivity',
			title: 'Site Sensitivity',
			value: getSiteSensitivityInfluence(row),
		},
		{
			key: 'forecastedRainfall',
			title: 'Forecasted Rainfall',
			value: getForecastedRainfallInfluence(row),
		},
	];
}
