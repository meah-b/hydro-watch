import LoadingScreen from '@/assets/components/screens/loading';
import getLastUpdatedText from '@/assets/utilities/getLastUpdatedText';
import { getLatestSiteState } from '@/assets/utilities/getLatestSiteState';
import classifySymmetryFromSides from '@/assets/utilities/getSiteSymmetryInfo';
import { classifySeverityFromSat } from '@/assets/utilities/riskDerivations';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	LayoutChangeEvent,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';

import getSiteConfig from '@/assets/utilities/getSiteConfig';
import getMoisture6hRows from '@/assets/utilities/getSoilMoistureHistory';
import ForecastVsIdfBarChart from '../../assets/components/graphics/ForecastVsIdfBarChart';
import FoundationMoistureMap from '../../assets/components/graphics/FoundationMoistureMap';
import SoilMoistureChartSvg from '../../assets/components/graphics/SoilMoistureChart';
import colors from '../../config/theme';
import {
	Influence,
	MoistureRow,
	SectionKey,
	SensorNodesMap,
	SiteConfig,
	SiteState,
} from '../../config/types';

function symmetryNoteFromSides(
	sym: Influence,
	satsBySide: Record<string, number>,
): string {
	const entries = Object.entries(satsBySide).sort((a, b) => b[1] - a[1]);
	const [wet1, wet2] = entries.slice(0, 2);

	if (sym === 'Low') {
		return `Moisture varies strongly by side. The ${wet1[0].toLowerCase()} and ${wet2[0].toLowerCase()} sides of the site are highest. Use side readings to guide monitoring.`;
	}

	if (sym === 'Moderate') {
		return `Moisture differs by side; ${wet1[0]} is highest. Monitor during rainfall.`;
	}

	return 'Moisture is consistent around the foundation.';
}

export default function Insights() {
	const [state, setState] = useState<SiteState | null>(null);
	const [config, setConfig] = useState<SiteConfig | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [moistureRows, setMoistureRows] = useState<MoistureRow[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	console.log('Insights render', {
		loading,
		hasState: !!state,
		hasConfig: !!config,
	});

	const load = useCallback(async () => {
		setLoading(true);
		try {
			setError(null);
			const [siteState, rows, cfg] = await Promise.all([
				getLatestSiteState(),
				getMoisture6hRows(),
				getSiteConfig(),
			]);

			setState(siteState);
			setMoistureRows(rows ?? []);
			setConfig(cfg ?? null);
		} catch (e: any) {
			setError(e?.message ?? 'Failed to load insights data');
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

	const moisture6h = useMemo(() => {
		const values = (moistureRows ?? [])
			.map((r) => Number(r.max_sat))
			.filter((v) => Number.isFinite(v));

		return values.length > 0 ? values : [0.0];
	}, [moistureRows]);

	const { scrollTo } = useLocalSearchParams<{ scrollTo?: SectionKey }>();
	const scrollRef = useRef<ScrollView>(null);
	const [sectionY, setSectionY] = useState<Record<SectionKey, number>>({
		foundation: 0,
		trend: 0,
		rain: 0,
	});

	const makeOnLayout = (key: SectionKey) => (e: LayoutChangeEvent) => {
		const y = e.nativeEvent.layout.y;
		setSectionY((prev) => (prev[key] === y ? prev : { ...prev, [key]: y }));
	};

	useEffect(() => {
		if (!scrollTo) return;
		const id = setTimeout(() => {
			const y = sectionY[scrollTo];
			scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
		}, 50);

		return () => clearTimeout(id);
	}, [scrollTo, sectionY]);

	const start = moisture6h[0] ?? 0;
	const end = moisture6h[moisture6h.length - 1] ?? start;
	const delta = end - start;
	const deltaText = `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`;
	const peakText = `${(Math.max(...moisture6h) * 100).toFixed(1)}%`;

	const satFront = state?.sat_front ?? 0;
	const satBack = state?.sat_back ?? 0;
	const satLeft = state?.sat_left ?? 0;
	const satRight = state?.sat_right ?? 0;

	const nodes: SensorNodesMap = useMemo(() => {
		return {
			front: {
				side: 'Front',
				moisture: satFront * 100,
				severity: classifySeverityFromSat(satFront),
			},
			left: {
				side: 'Left',
				moisture: satLeft * 100,
				severity: classifySeverityFromSat(satLeft),
			},
			back: {
				side: 'Back',
				moisture: satBack * 100,
				severity: classifySeverityFromSat(satBack),
			},
			right: {
				side: 'Right',
				moisture: satRight * 100,
				severity: classifySeverityFromSat(satRight),
			},
		};
	}, [satFront, satBack, satLeft, satRight]);

	const avgMoisture = ((satFront + satBack + satLeft + satRight) * 100) / 4;

	const symmetry: Influence = useMemo(() => {
		return classifySymmetryFromSides([satFront, satBack, satLeft, satRight]);
	}, [satFront, satBack, satLeft, satRight]);

	const symmetryNote = useMemo(() => {
		return symmetryNoteFromSides(symmetry, {
			Front: satFront,
			Back: satBack,
			Left: satLeft,
			Right: satRight,
		});
	}, [symmetry, satFront, satBack, satLeft, satRight]);

	const forecastedDepth24h = state?.forecast_24h_total_mm ?? 0;
	const lastUpdatedIso = state?.last_updated_iso;
	const lastUpdatedText = getLastUpdatedText(lastUpdatedIso || '');

	const idfDepth24h = config?.idf_24h_2yr_mm ?? 0;

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
				ref={scrollRef}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={[colors.red100, colors.blue200]}
					/>
				}>
				<View style={styles.card}>
					<View
						onLayout={makeOnLayout('foundation')}
						style={styles.cardHeaderRow}>
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

				<View
					onLayout={makeOnLayout('trend')}
					style={styles.card}>
					<Text style={styles.cardTitle}>Soil moisture trend</Text>
					<Text style={styles.mutedDesc}>
						Last 6 hours · all sides averaged
					</Text>
					<SoilMoistureChartSvg values={moisture6h} />
					<View style={styles.inlineStats}>
						<View style={styles.statItem}>
							<Text style={styles.metaLabel}>6h change</Text>
							<Text style={styles.metaValue}>{deltaText}</Text>
						</View>
						<View style={styles.statItem}>
							<Text style={styles.metaLabel}>Peak</Text>
							<Text style={styles.metaValue}>{peakText}</Text>
						</View>
					</View>
				</View>

				<View
					onLayout={makeOnLayout('rain')}
					style={styles.card}>
					<Text style={styles.cardTitle}>Rain intensity context</Text>
					<Text style={styles.mutedDesc}>
						Forecast rainfall compared to IDF reference levels.
					</Text>
					<View style={styles.barChart}>
						<ForecastVsIdfBarChart
							rainfallData={{ forecastedDepth24h, idfDepth24h }}
						/>
					</View>
					<Text style={styles.mutedDesc}>
						IDF curves are historical design references used for context only.
					</Text>
				</View>
				<Text style={styles.lastUpdated}>{lastUpdatedText}</Text>
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
		opacity: 0.75,
		paddingHorizontal: 16,
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
