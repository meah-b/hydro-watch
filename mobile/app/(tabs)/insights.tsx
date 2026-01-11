import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	LayoutChangeEvent,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import ForecastVsIdfBarChart from '../assets/components/graphics/ForecastVsIdfBarChart';
import FoundationMoistureMap from '../assets/components/graphics/FoundationMoistureMap';
import SoilMoistureChartSvg from '../assets/components/graphics/SoilMoistureChart';
import { getMoisture6hRows, getSiteRow } from '../assets/utilities/fakeDbParse';
import { asNumber } from '../assets/utilities/fakeDbTypes';
import colors from '../config/theme';
import { Influence, RainfallData, SensorNodesMap } from '../config/types';

type SectionKey = 'foundation' | 'trend' | 'rain';

const SITE_ID = 'site_001';

function clamp01(x: number): number {
	return Math.max(0, Math.min(1, x));
}

function satToPercent(sat: number): number {
	return clamp01(sat) * 100;
}

function classifySeverityFromSat(sat: number): 'Normal' | 'Elevated' | 'High' {
	// Stub thresholds, tweak later
	if (sat < 0.2) return 'Normal';
	if (sat < 0.6) return 'Elevated';
	return 'High';
}

function classifySymmetryFromSides(sats: number[]): Influence {
	// sats are 0..1
	const minV = Math.min(...sats);
	const maxV = Math.max(...sats);
	const spread = maxV - minV;

	// Stub thresholds (difference in saturation fraction)
	if (spread <= 0.08) return 'High';
	if (spread <= 0.2) return 'Moderate';
	return 'Low';
}

function symmetryNoteFromSides(
	sym: Influence,
	satsBySide: Record<string, number>
): string {
	// Identify wettest sides for a more specific note
	const entries = Object.entries(satsBySide).sort((a, b) => b[1] - a[1]);
	const [wet1, wet2] = entries.slice(0, 2);

	if (sym === 'Low') {
		return 'Moisture is consistent around the foundation.';
	}

	if (sym === 'Moderate') {
		return `Moisture differs by side; ${wet1[0]} is highest. Monitor during rainfall.`;
	}

	return `Moisture varies strongly by side; ${wet1[0]} and ${wet2[0]} are highest. Use side readings to guide monitoring.`;
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

export default function Insights() {
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

	const siteRow = useMemo(() => getSiteRow(SITE_ID), []);
	const moistureRows = useMemo(() => getMoisture6hRows(SITE_ID), []);

	// Moisture trend series (0..1)
	const moisture6h = useMemo(() => {
		const values = moistureRows
			.map((r) => asNumber(r.sat_avg))
			.filter((v) => Number.isFinite(v))
			.map((v) => clamp01(v));

		// Ensure chart always has something
		return values.length > 0 ? values : [0.0];
	}, [moistureRows]);

	const delta = moisture6h.at(-1)! - moisture6h[0];
	const deltaText = `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`;
	const peakText = `${(Math.max(...moisture6h) * 100).toFixed(1)}%`;

	// Foundation nodes from per-side sat values (0..1)
	const satFront = clamp01(asNumber(siteRow.sat_front));
	const satBack = clamp01(asNumber(siteRow.sat_back));
	const satLeft = clamp01(asNumber(siteRow.sat_left));
	const satRight = clamp01(asNumber(siteRow.sat_right));

	const nodes: SensorNodesMap = useMemo(() => {
		return {
			front: {
				side: 'Front',
				moisture: satToPercent(satFront),
				severity: classifySeverityFromSat(satFront),
			},
			left: {
				side: 'Left',
				moisture: satToPercent(satLeft),
				severity: classifySeverityFromSat(satLeft),
			},
			back: {
				side: 'Back',
				moisture: satToPercent(satBack),
				severity: classifySeverityFromSat(satBack),
			},
			right: {
				side: 'Right',
				moisture: satToPercent(satRight),
				severity: classifySeverityFromSat(satRight),
			},
		};
	}, [satFront, satBack, satLeft, satRight]);

	const avgMoisture = satToPercent(clamp01(asNumber(siteRow.sat_avg)));

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

	// Rainfall context from CSV
	const rainfallData: RainfallData = useMemo(() => {
		return {
			forecastedDepth24h: asNumber(siteRow.forecast_24h_total_mm),
			idfDepth24h: asNumber(siteRow.IDF_24h_2yr_mm),
		};
	}, [siteRow]);

	const lastUpdatedIso = siteRow.last_updated_iso || '';
	const lastUpdatedText = lastUpdatedIso
		? `Last updated: ${formatMinutesAgo(lastUpdatedIso)}`
		: 'Last updated: unknown';

	return (
		<LinearGradient
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			colors={colors.gradient}
			style={styles.root}>
			<ScrollView
				ref={scrollRef}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
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
						<ForecastVsIdfBarChart rainfallData={rainfallData} />
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
		marginTop: 2,
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
