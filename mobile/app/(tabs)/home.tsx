import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import ForecastCard from '../../assets/components/cards/ForecastCard';
import SmallMetricCard, {
	LargeMetricCard,
	MediumMetricCard,
	WarningCard,
} from '../../assets/components/cards/MetricCard';

import LoadingScreen from '@/assets/components/screens/loading';
import getLastUpdatedText from '@/assets/utilities/getLastUpdatedText';
import { getLatestSiteState } from '@/assets/utilities/getLatestSiteState';
import getSensorStatus from '@/assets/utilities/getSensorStatus';
import classifySymmetryFromSides from '@/assets/utilities/getSiteSymmetryInfo';
import { SiteState } from '@/config/types';
import { getRiskLevel } from '../../assets/utilities/riskDerivations';
import colors from '../../config/theme';

export default function Home() {
	const [state, setState] = useState<SiteState | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;

		getLatestSiteState()
			.then((data) => {
				if (mounted) setState(data);
			})
			.catch((e) => {
				if (mounted) setError(e.message ?? 'Failed to load site state');
			})
			.finally(() => {
				if (mounted) setLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, []);

	// TODO: later source from Environment Canada API
	const hasActiveWarning = true;

	const riskScore = Number(state?.risk_score ?? NaN);
	const riskLevel = getRiskLevel(riskScore);
	const maxSat = Number(state?.max_sat ?? NaN);
	const soilMoistureValue = (maxSat * 100).toFixed(1) + '%';
	const satFront = state?.sat_front ?? 0;
	const satBack = state?.sat_back ?? 0;
	const satLeft = state?.sat_left ?? 0;
	const satRight = state?.sat_right ?? 0;
	const siteSymmetryValue = classifySymmetryFromSides([
		satFront,
		satBack,
		satLeft,
		satRight,
	]);
	const forecastTotal = Number(state?.forecast_24h_total_mm ?? NaN);
	const forecastHourly = (state?.forecast_24h_hourly_mm ?? []) as number[];
	const sensorStatusValue = getSensorStatus(state?.qc_report);
	const lastUpdatedIso = state?.last_updated_iso;
	const lastUpdatedText = getLastUpdatedText(lastUpdatedIso || '');

	if (loading) {
		return (
			<LoadingScreen
				state='loading'
				error={null}
			/>
		);
	}

	if (error || !state) {
		return (
			<LoadingScreen
				state='error'
				error={error}
			/>
		);
	}

	return (
		<LinearGradient
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			colors={colors.gradient}
			style={styles.root}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				<LargeMetricCard
					title='Flood risk'
					value={riskLevel.toUpperCase()}
					desc='Based on current soil moisture, site sensitivity, and storm factors'
					onPress={() => router.push('/(tabs)/risk')}
				/>

				<View style={styles.twoColRow}>
					<SmallMetricCard
						title='Soil moisture'
						value={soilMoistureValue}
						desc={`Based on the max site saturation`}
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
						desc={'Based on side-to-side moisture variation'}
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
					desc='Estimated battery life: 6 months' // TODO: dynamic
					onPress={() => {}}
				/>
				<Text style={styles.lastUpdated}>{lastUpdatedText}</Text>
			</ScrollView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	actionRow: {
		gap: 10,
		marginTop: 2,
	},

	actionBtn: {
		height: 52,
		borderRadius: 15,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.white,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 5,
	},

	actionBtnText: {
		color: colors.black,
		fontSize: 15,
		fontWeight: '900',
	},

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
