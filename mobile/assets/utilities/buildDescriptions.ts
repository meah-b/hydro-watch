import { DriverKey, Influence, RiskLevel } from '@/config/types';

export function buildInfluenceDesc(key: DriverKey, value: Influence): string {
	switch (key) {
		case 'soil':
			switch (value) {
				case 'High':
					return 'Soil is near/above saturation and likely generating strong pressure against the foundation.';
				case 'Moderate':
					return 'Soil is wetter than normal and pressure is beginning to build, especially if rain continues.';
				default:
					return 'Soil is dry enough that seepage pressure is unlikely.';
			}

		case 'sensitivity':
			switch (value) {
				case 'High':
					return 'Soil is absorbing water rapidly, indicating strong short-term vulnerability to this storm.';
				case 'Moderate':
					return 'Soil moisture is rising, suggesting increasing sensitivity to ongoing rainfall.';
				default:
					return 'Soil response is slow, indicating low short-term sensitivity.';
			}

		case 'storm':
			switch (value) {
				case 'High':
					return 'Forecast rainfall is comparable to or larger than a typical design storm for this area.';
				case 'Moderate':
					return 'Forecast rainfall is elevated for local conditions and could meaningfully increase soil wetting.';
				default:
					return 'Forecast rainfall is light relative to normal storm levels.';
			}
	}
}

export function buildRiskDesc(risk: RiskLevel): string {
	switch (risk) {
		case 'Low':
			return 'Conditions are stable and flood risk is low. Continue normal monitoring.';
		case 'Moderate':
			return 'Conditions may support localized water accumulation if rainfall increases. Monitoring is recommended, especially during rainfall.';
		case 'High':
			return 'Conditions indicate elevated flood potential. Closely monitor updates and follow official guidance if warnings are issued.';
		case 'Severe':
			return 'Conditions indicate a high likelihood of flooding impacts. Take precautions and follow official warnings and evacuation guidance if issued.';
	}
}
