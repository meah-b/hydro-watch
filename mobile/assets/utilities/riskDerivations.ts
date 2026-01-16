import type {
	DriverItem,
	Influence,
	RiskLevel,
	Severity,
} from '@/config/types';

export function classifySeverityFromSat(sat: number): Severity {
	if (sat < 0.05) return 'Normal';
	if (sat < 0.6) return 'Elevated';
	return 'High';
}

export function getRiskLevel(score: number): RiskLevel {
	if (score < 25) {
		return 'Low';
	} else if (score < 50) {
		return 'Moderate';
	} else if (score < 75) {
		return 'High';
	} else {
		return 'Severe';
	}
}

export function getBaseRiskInfluence(base_risk: number | undefined): Influence {
	const influence = Number(base_risk);

	if (influence < 33) {
		return 'Low';
	} else if (influence < 66) {
		return 'Moderate';
	} else {
		return 'High';
	}
}

export function getRiskFactorInfluence(factor: number | undefined): Influence {
	const influence = Number(factor);

	if (influence < 0.33) {
		return 'Low';
	} else if (influence < 0.66) {
		return 'Moderate';
	} else {
		return 'High';
	}
}

export function buildRiskDrivers(
	base_soil_risk?: number,
	site_sensitivity_factor?: number,
	storm_factor?: number
): DriverItem[] {
	return [
		{
			key: 'soil',
			title: 'Soil Moisture',
			value: getBaseRiskInfluence(base_soil_risk),
		},
		{
			key: 'sensitivity',
			title: 'Site Sensitivity',
			value: getRiskFactorInfluence(site_sensitivity_factor),
		},
		{
			key: 'storm',
			title: 'Forecasted Rainfall',
			value: getRiskFactorInfluence(storm_factor),
		},
	];
}
