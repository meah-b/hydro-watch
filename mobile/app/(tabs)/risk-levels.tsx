import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MediumMetricCard } from '../assets/components/cards/MetricCard';
import RiskGauge from '../assets/components/utilities/RiskGauge';
import colors from '../config/theme';

type Influence = 'Low' | 'Moderate' | 'High';

function influenceDesc(
	kind: 'soil' | 'sensitivity' | 'rain',
	level: Influence
) {
	if (kind === 'soil') {
		if (level === 'High') return 'Soil near field capacity for clay soils';
		if (level === 'Moderate')
			return 'Soil moisture elevated for current conditions';
		return 'Soil moisture currently within normal range';
	}
	if (kind === 'sensitivity') {
		if (level === 'High') return 'Site conditions increase runoff potential';
		if (level === 'Moderate')
			return 'Some site factors may elevate vulnerability';
		return 'Site factors are not strongly elevating risk';
	}
	// rain
	if (level === 'High') return 'Heavier rainfall expected in the next 24 hours';
	if (level === 'Moderate') return 'Rain expected within the next 24 hours';
	return 'Low rainfall expected in the near term';
}

function riskMeaning(risk: 'Low' | 'Moderate' | 'High') {
	if (risk === 'Low')
		return `Conditions are stable and flood risk is low. Continue normal monitoring.`;
	if (risk === 'Moderate')
		return `Conditions may support localized water accumulation if rainfall increases. Monitoring is recommended, especially during rainfall.`;
	return `Conditions indicate elevated flood potential. Closely monitor updates and follow official guidance if warnings are issued.`;
}

function recommendedResponse(risk: 'Low' | 'Moderate' | 'High') {
	if (risk === 'Low') {
		return [
			'No immediate action required',
			'Check again after major rainfall events',
		];
	}
	if (risk === 'Moderate') {
		return [
			'No immediate action required',
			'Monitor conditions during rainfall',
		];
	}
	return ['Monitor conditions closely', 'Review any active flood warnings'];
}

export default function RiskLevels() {
	const riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Moderate';
	const riskScore = 33;

	const drivers: {
		title: string;
		value: Influence;
		desc: string;
	}[] = [
		{
			title: 'Soil moisture',
			value: 'High',
			desc: influenceDesc('soil', 'High'),
		},
		{
			title: 'Site sensitivity',
			value: 'Low',
			desc: influenceDesc('sensitivity', 'Low'),
		},
		{
			title: 'Forecasted rainfall',
			value: 'Moderate',
			desc: influenceDesc('rain', 'Moderate'),
		},
	];

	const [action1, action2] = recommendedResponse(riskLevel);

	return (
		<LinearGradient
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			colors={colors.gradient}
			style={styles.root}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				<View style={styles.cardHero}>
					<View style={{ alignItems: 'center', gap: 6 }}>
						<Text style={styles.heroValue}>
							{riskLevel.toUpperCase()} FLOOD RISK
						</Text>
						<RiskGauge score={riskScore} />
						<Text style={styles.mutedDesc}>Risk score: {riskScore} / 100</Text>
					</View>
					<Text style={styles.cardDesc}>{riskMeaning(riskLevel)}</Text>
				</View>

				<Text style={styles.sectionTitle}>Risk drivers</Text>

				<View style={styles.driverList}>
					{drivers.map((d) => (
						<MediumMetricCard
							key={d.title}
							title={d.title}
							value={`${d.value} influence`}
							desc={d.desc}
						/>
					))}
				</View>

				<MediumMetricCard
					title='Recommended response'
					value={`• ${action1}\n• ${action2}`}
					desc='Follow official guidance if flood watches or warnings are issued.'
				/>

				<Text style={styles.finePrint}>
					This is a predictive estimate based on current sensor readings and
					forecast models.
				</Text>
			</ScrollView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	cardDesc: {
		fontSize: 14,
		fontWeight: '500',
	},

	cardHero: {
		borderRadius: 18,
		padding: 18,
		gap: 10,
		backgroundColor: colors.white,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 5,
	},

	driverList: {
		gap: 10,
	},

	finePrint: {
		fontSize: 13,
		marginTop: 2,
		opacity: 0.75,
		paddingHorizontal: 16,
	},

	heroValue: {
		fontSize: 26,
		fontWeight: '800',
		letterSpacing: 0.5,
	},

	mutedDesc: {
		fontSize: 13,
		opacity: 0.75,
	},

	root: {
		flex: 1,
		paddingTop: 100,
	},

	scrollContent: {
		gap: 12,
		paddingBottom: 100,
		paddingHorizontal: 16,
		paddingTop: 12,
	},

	sectionTitle: {
		fontSize: 14,
		fontWeight: '600',
		opacity: 0.9,
		paddingHorizontal: 10,
	},
});
