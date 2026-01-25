import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import {
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';

import LoadingScreen from '@/assets/components/screens/loading';
import {
	buildInfluenceDesc,
	buildRiskDesc,
} from '@/assets/utilities/buildDescriptions';
import getLastUpdatedText from '@/assets/utilities/getLastUpdatedText';
import { getLatestSiteState } from '@/assets/utilities/getLatestSiteState';
import getSensorStatus from '@/assets/utilities/getSensorStatus';
import { useFocusEffect } from 'expo-router';
import RiskGauge from '../../assets/components/graphics/RiskGauge';
import {
	buildRiskDrivers,
	getRiskLevel,
} from '../../assets/utilities/riskDerivations';
import colors from '../../config/theme';
import type { Influence, SiteState } from '../../config/types';

const INFLUENCE_PILL_BG: Record<Influence, string> = {
	Low: colors.green200,
	Moderate: colors.yellow100,
	High: colors.red200,
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
	const [state, setState] = useState<SiteState | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			setError(null);
			const data = await getLatestSiteState();
			setState(data);
		} catch (e: any) {
			setError(e?.message ?? 'Failed to load site state');
		} finally {
			setLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			load();
		}, [load]),
	);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await load();
		setRefreshing(false);
	}, [load]);

	const sensorStatus = useMemo(() => {
		if (!state?.qc_report) return null;
		return getSensorStatus(state.qc_report);
	}, [state]);

	const riskScore = Number((state?.risk_score ?? NaN).toFixed(0));
	const riskLevel = getRiskLevel(riskScore);
	const lastUpdatedIso = state?.last_updated_iso;
	const lastUpdatedText = getLastUpdatedText(lastUpdatedIso || '');

	const driverRows = useMemo(() => {
		const drivers = buildRiskDrivers(
			state?.base_soil_risk,
			state?.site_sensitivity_factor,
			state?.storm_factor,
		);
		return drivers.map((d) => ({
			...d,
			desc: buildInfluenceDesc(d.key, d.value),
		}));
	}, [state]);

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

	if (sensorStatus?.failed) {
		return (
			<LoadingScreen
				state='error'
				error='Sensor data is unavailable. Risk assessment cannot be performed at this time.'
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
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
					/>
				}>
				<View style={styles.cardHero}>
					<View style={{ alignItems: 'center', gap: 6 }}>
						<Text style={styles.heroValue}>
							{riskLevel.toUpperCase()} FLOOD RISK
						</Text>
						<RiskGauge score={riskScore} />
						<Text style={styles.mutedDesc}>Risk score: {riskScore} / 100</Text>
					</View>
					<Text style={styles.cardDesc}>{buildRiskDesc(riskLevel)}</Text>
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

				<Text style={styles.lastUpdated}>{lastUpdatedText}</Text>
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
