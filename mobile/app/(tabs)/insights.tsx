import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
	LayoutChangeEvent,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import ForecastVsIdfBarChart from '../assets/components/utilities/ForecastVsIdfBarChart';
import FoundationMoistureMap from '../assets/components/utilities/FoundationMoistureMap';
import SoilMoistureChartSvg from '../assets/components/utilities/SoilMoistureChart';
import colors from '../config/theme';
import { Influence, RainfallData, SensorNodesMap } from '../config/types';

type SectionKey = 'foundation' | 'trend';

export default function Insights() {
	const { scrollTo } = useLocalSearchParams<{ scrollTo?: SectionKey }>();

	const scrollRef = useRef<ScrollView>(null);

	const [sectionY, setSectionY] = useState<Record<SectionKey, number>>({
		foundation: 0,
		trend: 0,
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

	const moisture6h = [
		0.22, 0.23, 0.24, 0.268, 0.27, 0.31, 0.373, 0.375, 0.376, 0.378, 0.38,
		0.381, 0.384, 0.386, 0.387, 0.389, 0.39, 0.391, 0.45, 0.5, 0.52, 0.54, 0.55,
		0.6, 0.577,
	];
	const delta = moisture6h.at(-1)! - moisture6h[0];
	const deltaText = `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`;

	const rainfallData: RainfallData = {
		forecastedDepth24h: 2.1,
		idfDepth24h: 60.91,
	};
	const nodes: SensorNodesMap = {
		front: { side: 'Front', moisture: 60.0, severity: 'Elevated' },
		left: { side: 'Left', moisture: 55.0, severity: 'Normal' },
		back: { side: 'Back', moisture: 50.0, severity: 'Normal' },
		right: { side: 'Right', moisture: 66.0, severity: 'Elevated' },
	};
	const avgMoisture = 57.7;
	const symmetry: Influence = 'High';
	const symmetryNote =
		symmetry === 'High'
			? 'Moisture is consistent around the foundation.'
			: symmetry === 'Moderate'
			? 'Moisture differs by side; monitor the highest side during rainfall.'
			: 'Moisture varies strongly by side; use side readings to guide monitoring.';

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
					{/* TODO: add info icon with details drawer */}
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
							<Text style={styles.metaValue}>
								{(Math.max(...moisture6h) * 100).toFixed(1)}%
							</Text>
						</View>
					</View>
				</View>

				<View style={styles.card}>
					{/* TODO: add info icon with details drawer */}
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
