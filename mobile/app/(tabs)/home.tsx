import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
	Linking,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';

import ForecastCard from '../assets/components/cards/ForecastCard';
import SmallMetricCard, {
	LargeMetricCard,
	MediumMetricCard,
	WarningCard,
} from '../assets/components/cards/MetricCard';

import { getSiteRow } from '../assets/utilities/fakeDbParse';
import {
	asBoolean,
	asJsonArrayNumber,
	asNumber,
} from '../assets/utilities/fakeDbTypes';
import { getRiskLevel } from '../assets/utilities/riskDerivations';
import colors from '../config/theme';

const SITE_ID = 'site_001';

function formatSatPercent(sat01: number): string {
	const pct = Math.max(0, Math.min(100, sat01 * 100));
	return `${pct.toFixed(1)}%`;
}

function formatMinutesAgo(iso: string): string {
	const t = Date.parse(iso);
	if (!Number.isFinite(t)) return 'unknown';

	const diffMs = Date.now() - t;
	const diffMin = Math.max(0, Math.round(diffMs / (60 * 1000)));

	if (diffMin < 1) return 'just now';
	if (diffMin === 1) return '1 minute ago';
	if (diffMin < 60) return `${diffMin} minutes ago`;

	const diffHr = Math.floor(diffMin / 60);
	if (diffHr === 1) return '1 hour ago';
	return `${diffHr} hours ago`;
}

export default function Home() {
	const row = useMemo(() => getSiteRow(SITE_ID), []);
	// TODO: later source from AWS (warning table / Environment Canada API)
	const hasActiveWarning = true;
	const locationLabel = row.location_label;
	const riskScore = asNumber(row.risk_score);
	const riskLevel = getRiskLevel(riskScore);

	// TODO: replace with “1 sentence per category” mapping
	const riskDesc =
		riskLevel === 'Low'
			? 'Low flood risk based on current conditions.'
			: riskLevel === 'Moderate'
			? 'Elevated due to soil saturation and rainfall.'
			: riskLevel === 'High'
			? 'High risk due to wet soil and forecast rainfall.'
			: 'Severe risk. Prepare for potential flooding.';

	const satAvg = asNumber(row.sat_avg);
	const soilMoistureValue = Number.isFinite(satAvg)
		? formatSatPercent(satAvg)
		: '—';

	// TODO: pull symmetry from CSV later (or calculate in app from per-side sats)
	const siteSymmetryValue = 'High';
	const siteSymmetryDesc = 'Moisture consistent around foundation';

	const sensorsOk = asBoolean(row.qc_all_sensors_normal);
	const sensorStatusValue = sensorsOk
		? '4/4 sensors reporting normally.'
		: 'Sensor issue detected.';

	const lastUpdatedIso = row.last_updated_iso || row.timestamp_iso || '';
	const lastUpdatedText = lastUpdatedIso
		? `Last updated: ${formatMinutesAgo(lastUpdatedIso)}`
		: 'Last updated: unknown';

	const forecastTotal = asNumber(row.forecast_24h_total_mm);
	const forecastHourly = asJsonArrayNumber(row.forecast_24h_hourly_mm);

	return (
		<LinearGradient
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			colors={colors.gradient}
			style={styles.root}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				<Pressable
					style={({ pressed }) => ({
						opacity: pressed ? 0.5 : 1,
					})}
					onPress={() => {}}>
					<Text style={styles.locationText}>{locationLabel}</Text>
				</Pressable>
				<LargeMetricCard
					title='Flood risk'
					value={riskLevel.toUpperCase()}
					desc={riskDesc}
					onPress={() => router.push('/(tabs)/risk')}
				/>

				<View style={styles.twoColRow}>
					<SmallMetricCard
						title='Soil moisture'
						value={soilMoistureValue}
						desc='Based on normalized average saturation'
						onPress={() =>
							router.push({
								pathname: '/(tabs)/insights',
								params: { scrollTo: 'trend' },
							})
						}
					/>

					<SmallMetricCard
						title='Site symmetry'
						value={siteSymmetryValue}
						desc={siteSymmetryDesc}
						onPress={() =>
							router.push({
								pathname: '/(tabs)/insights',
								params: { scrollTo: 'foundation' },
							})
						}
					/>
				</View>

				<ForecastCard
					total24hMm={forecastTotal}
					hourlyMm={forecastHourly}
					onPress={() =>
						router.push({
							pathname: '/(tabs)/insights',
							params: { scrollTo: 'rain' },
						})
					}
				/>

				{hasActiveWarning && (
					<WarningCard
						title='Flood warning issued'
						value='Environment Canada'
						desc='Valid until Jan 1, 6:00 AM'
						onPress={() => {
							Linking.openURL('https://weather.gc.ca/warnings');
						}}
					/>
				)}

				<MediumMetricCard
					title='Sensor Status'
					value={sensorStatusValue}
					desc='Estimated battery life: 6 months'
					onPress={() => {}}
				/>

				<Text style={styles.lastUpdated}>{lastUpdatedText}</Text>
			</ScrollView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	contextBlock: {
		gap: 4,
		marginBottom: 4,
		marginLeft: 10,
	},

	lastUpdated: {
		fontSize: 13,
		marginTop: 2,
		opacity: 0.75,
		paddingHorizontal: 16,
	},

	locationText: {
		fontSize: 16,
		fontWeight: '500',
		textDecorationLine: 'underline',
		marginLeft: 5,
	},

	root: {
		flex: 1,
		paddingTop: 100,
	},

	scrollContent: {
		gap: 10,
		paddingBottom: 100,
		paddingHorizontal: 16,
		paddingTop: 4,
	},

	twoColRow: {
		flexDirection: 'row',
		gap: 12,
	},
});
