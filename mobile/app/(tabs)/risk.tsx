import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MediumMetricCard } from '../assets/components/cards/MetricCard';
import RiskGauge from '../assets/components/graphics/RiskGauge';
import { getSiteRow } from '../assets/utilities/fakeDbParse';
import {
	buildRiskDrivers,
	getRiskLevel,
	getRiskScore,
} from '../assets/utilities/riskDerivations';
import colors from '../config/theme';
import type { DriverKey, Influence, RiskLevel } from '../config/types';

const INFLUENCE_PILL_BG: Record<Influence, string> = {
	Low: colors.green200,
	Moderate: colors.yellow100,
	High: colors.red200,
};

const influenceDesc = (key: DriverKey, value: Influence): string => {
	switch (key) {
		case 'soilMoisture':
			switch (value) {
				case 'High':
					return 'Soil near field capacity';
				case 'Moderate':
					return 'Soil moisture elevated for current conditions';
				default:
					return 'Soil moisture currently within normal range';
			}

		case 'siteSensitivity':
			switch (value) {
				case 'High':
					return 'Site conditions increase runoff potential';
				case 'Moderate':
					return 'Some site factors may elevate vulnerability';
				default:
					return 'Site factors are not strongly elevating risk';
			}

		case 'forecastedRainfall':
			switch (value) {
				case 'High':
					return 'Heavier rainfall expected in the next 24 hours';
				case 'Moderate':
					return 'Rain expected within the next 24 hours';
				default:
					return 'Low rainfall expected in the near term';
			}
	}
};

const riskMeaning = (risk: RiskLevel): string => {
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
};

function InfluenceRow(props: {
	label: string;
	value: Influence;
	desc: string;
}) {
	const { label, value, desc } = props;
	return (
		<View style={styles.driverRow}>
			<View style={{ flex: 1, gap: 2 }}>
				<Text style={styles.driverLabel}>{label}</Text>
				<Text style={styles.mutedDesc}>{desc}</Text>
			</View>

			<View
				style={[styles.pill, { backgroundColor: INFLUENCE_PILL_BG[value] }]}>
				<Text style={styles.pillText}>{value} influence</Text>
			</View>
		</View>
	);
}

export default function Risk() {
	const row = getSiteRow('site_001');

	const riskScore = getRiskScore(row);
	const riskLevel = getRiskLevel(riskScore);

	const driverRows = useMemo(() => {
		const drivers = buildRiskDrivers(row);
		return drivers.map((d) => ({
			...d,
			desc: influenceDesc(d.key, d.value),
		}));
	}, [row]);

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
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Current risk drivers</Text>
					<View style={styles.driverList}>
						{driverRows.map((d) => (
							<InfluenceRow
								key={d.key}
								label={d.title}
								value={d.value}
								desc={d.desc}
							/>
						))}
					</View>
					<Text style={styles.mutedDesc}>
						Influence ratings describe how strongly each factor is contributing
						to the current risk estimate.
					</Text>
				</View>

				<MediumMetricCard
					title='Recommended action'
					value='No immediate action required'
					desc='Monitor conditions this evening'
				/>

				<Text style={styles.lastUpdated}>Last updated: 12 minutes ago</Text>
			</ScrollView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: 16,
		padding: 18,
		gap: 10,
		backgroundColor: colors.white,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 5,
	},

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

	cardTitle: {
		fontSize: 14,
		fontWeight: '600',
		opacity: 0.9,
	},

	driverLabel: {
		fontSize: 14,
		fontWeight: '700',
	},

	driverList: {
		gap: 12,
		marginVertical: 2,
	},

	driverRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},

	heroValue: {
		fontSize: 26,
		fontWeight: '800',
		letterSpacing: 0.5,
	},

	lastUpdated: {
		fontSize: 13,
		marginTop: 2,
		opacity: 0.75,
		paddingHorizontal: 16,
	},

	mutedDesc: {
		fontSize: 13,
		opacity: 0.75,
	},

	pill: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
	},

	pillText: {
		fontSize: 12,
		fontWeight: '700',
		opacity: 0.85,
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
