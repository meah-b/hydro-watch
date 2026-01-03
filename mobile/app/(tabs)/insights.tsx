import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ForecastVsIdfBarChart from '../assets/components/utilities/ForecastVsIdfBarChart';
import FoundationMoistureMap from '../assets/components/utilities/FoundationMoistureMap';
import SoilMoistureChartSvg from '../assets/components/utilities/SoilMoistureChart';
import colors from '../config/theme';

type Influence = 'Low' | 'Moderate' | 'High';
type Severity = 'Normal' | 'Elevated' | 'High';
type Side = 'Front' | 'Back' | 'Right' | 'Left';

function InfluenceRow({
	label,
	value,
	desc,
}: {
	label: string;
	value: Influence;
	desc: string;
}) {
	const pillText = `${value} influence`;
	return (
		<View style={styles.driverRow}>
			<View style={{ flex: 1, gap: 2 }}>
				<Text style={styles.driverLabel}>{label}</Text>
				<Text style={styles.mutedDesc}>{desc}</Text>
			</View>
			<View
				style={[
					styles.pill,
					{
						backgroundColor:
							value === 'High'
								? colors.red200
								: value === 'Moderate'
								? colors.yellow100
								: colors.green200,
					},
				]}>
				<Text style={styles.pillText}>{pillText}</Text>
			</View>
		</View>
	);
}

export default function Insights() {
	const moisture6h = [
		36.2, 36.4, 36.5, 36.8, 37.0, 37.1, 37.3, 37.5, 37.6, 37.8, 38.0, 38.1,
		38.4, 38.6, 38.7, 38.9, 39.0, 39.1, 39.2, 39.3, 39.4, 39.4, 39.5, 39.5,
		39.5,
	];
	const nodes: { side: Side; value: number; sev: Severity }[] = [
		{ side: 'Front', value: 42.1, sev: 'Elevated' },
		{ side: 'Left', value: 37.9, sev: 'Normal' },
		{ side: 'Back', value: 36.2, sev: 'Normal' },
		{ side: 'Right', value: 41.8, sev: 'Elevated' },
	];
	const avgMoisture = 39.5;
	const symmetry: 'High' | 'Moderate' | 'Low' = 'High';
	const symmetryNote =
		symmetry === 'High'
			? 'Moisture is consistent around the foundation.'
			: symmetry === 'Moderate'
			? 'Moisture differs by side; monitor the highest side during rainfall.'
			: 'Moisture varies strongly by side; use side readings to guide monitoring.';

	const drivers: { label: string; value: Influence; desc: string }[] = [
		{
			label: 'Soil moisture',
			value: 'High',
			desc: 'Soil near field capacity for clay soils.',
		},
		{
			label: 'Site sensitivity',
			value: 'Low',
			desc: 'Site factors are not strongly elevating risk.',
		},
		{
			label: 'Forecasted rainfall',
			value: 'Moderate',
			desc: 'Rain expected within the next 12 hours.',
		},
	];

	return (
		<LinearGradient
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			colors={colors.gradient}
			style={styles.root}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Current risk drivers</Text>
					<View style={styles.driverList}>
						{drivers.map((d) => (
							<InfluenceRow
								key={d.label}
								label={d.label}
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

				<View style={styles.card}>
					<View style={styles.cardHeaderRow}>
						<Text style={styles.cardTitle}>Foundation moisture</Text>
						<View style={styles.rightMeta}>
							<Text style={styles.metaLabel}>Avg</Text>
							<Text style={styles.metaValue}>{avgMoisture.toFixed(1)}%</Text>
						</View>
					</View>
					<FoundationMoistureMap nodes={nodes} />
					<View style={styles.divider} />
					<Text style={styles.cardLabel}>Symmetry</Text>
					<Text style={styles.actionPrimary}>{symmetry}</Text>
					<Text style={styles.mutedDesc}>{symmetryNote}</Text>
				</View>

				<View style={styles.card}>
					{/* <View style={styles.cardHeaderRow}></View> */}
					<Text style={styles.cardTitle}>Soil moisture trend</Text>
					<Text style={styles.mutedDesc}>
						Last 6 hours · all sides averaged
					</Text>
					<SoilMoistureChartSvg
						values={moisture6h}
						fieldCapacity={38}
						saturation={46}
					/>
					<View style={styles.inlineStats}>
						<View style={styles.statItem}>
							<Text style={styles.metaLabel}>6h change</Text>
							<Text style={styles.metaValue}>+3.2%</Text>
						</View>
						<View style={styles.statItem}>
							<Text style={styles.metaLabel}>Peak</Text>
							<Text style={styles.metaValue}>42.1%</Text>
						</View>
					</View>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Rain intensity context</Text>
					<Text style={styles.mutedDesc}>
						Forecast rainfall compared to IDF reference levels.
					</Text>
					<View style={styles.barChart}>
						<ForecastVsIdfBarChart
							forecastMm={5.1}
							idfMm={60}
						/>
					</View>
					<Text style={styles.mutedDesc}>
						IDF curves are historical design references used for context only.
					</Text>
				</View>

				<Text style={styles.lastUpdated}>Last updated: 12 minutes ago</Text>
			</ScrollView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	barChart: {
		alignItems: 'center',
	},

	root: {
		flex: 1,
		paddingTop: 100,
	},

	scrollContent: {
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 100,
		gap: 12,
	},

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

	cardTitle: {
		fontSize: 14,
		fontWeight: '600',
		opacity: 0.9,
	},

	cardLabel: {
		fontSize: 13,
		fontWeight: '600',
		opacity: 0.8,
	},

	actionPrimary: {
		fontSize: 16,
		fontWeight: '700',
	},

	mutedDesc: {
		fontSize: 13,
		opacity: 0.75,
	},

	lastUpdated: {
		fontSize: 13,
		marginTop: 2,
		opacity: 0.75,
		paddingHorizontal: 16,
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

	driverLabel: {
		fontSize: 14,
		fontWeight: '700',
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

	cardHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'baseline',
	},

	rightMeta: {
		flexDirection: 'row',
		gap: 8,
		alignItems: 'baseline',
	},

	metaLabel: {
		fontSize: 12,
		opacity: 0.65,
		fontWeight: '600',
	},

	metaValue: {
		fontSize: 13,
		fontWeight: '700',
		opacity: 0.9,
	},

	divider: {
		height: 1,
		backgroundColor: 'rgba(0,0,0,0.06)',
		marginVertical: 4,
	},

	inlineStats: {
		flexDirection: 'row',
		gap: 18,
		marginTop: 2,
	},

	statItem: {
		gap: 2,
	},
});
