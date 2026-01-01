import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
// import Ionicons from '@expo/vector-icons/Ionicons';
// import IconButton from '@/components/IconButton'; // your wrapper

// type Props = {
// 	// example props; replace with your state/store
// 	locationLabel: string; // "London, ON"
// 	soilTypeLabel: string; // "Clay soil"
// 	riskLevelLabel: string; // "MODERATE"
// 	riskDescription: string; // "Elevated due to soil saturation and rainfall"
// 	soilMoistureValue: string; // "39.5%"
// 	soilMoistureDesc: string; // "Near field capacity for clay soils"
// 	symmetryValue: string; // "Symmetrical"
// 	symmetryDesc: string; // "Moisture consistent around foundation"
// 	rainSummary1: string; // "Peak rainfall ~6h"
// 	rainSummary2: string; // "~5.1 mm expected in next 24h"
// 	hasActiveWarning: boolean;
// 	warningTitle?: string; // "Flood warning issued"
// 	warningAuthority?: string; // "Upper Thames River Conservation Authority"
// 	warningValidUntil?: string; // "Valid until Jan 1, 6:00 AM"
// 	actionPrimary: string; // "No immediate action required"
// 	actionSecondary: string; // "Monitor conditions this evening"
// 	lastUpdatedLabel: string; // "Last updated: 12 minutes ago"
// };

export default function Analytics() {
	const hasActiveWarning = true; // example; replace with your state/store

	return (
		<View style={styles.root}>
			{/* Top utility bar: icons only */}
			<View style={styles.topBar}>
				<View style={styles.topBarSpacer} />
				<View style={styles.topBarActions}>
					{/* <IconButton icon="notifications-outline" onPress={...} /> */}
					{/* <IconButton icon="menu" onPress={...} /> */}
					<View style={styles.iconStub} />
					<View style={styles.iconStub} />
				</View>
			</View>

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				{/* Context (not a card) */}
				<View style={styles.contextBlock}>
					<Text style={styles.pageTitle}>Overview</Text>
					<Text style={styles.locationText}>London, ON</Text>
					<Text style={styles.subtleText}>Soil type: clay</Text>
				</View>

				{/* Hero risk card */}
				<View style={styles.cardHero}>
					<Text style={styles.cardLabel}>Flood risk</Text>
					<Text style={styles.heroValue}>MODERATE</Text>
					<Text style={styles.cardDesc}>
						Elevated due to soil saturation and rainfall
					</Text>
				</View>

				{/* Two-up row */}
				<View style={styles.twoColRow}>
					<View style={[styles.card, styles.twoColCard]}>
						<Text style={styles.cardTitle}>Soil moisture</Text>
						<Text style={styles.metricValue}>39.5%</Text>
						<Text style={styles.mutedDesc}>
							Near field capacity for clay soils
						</Text>
					</View>

					<View style={[styles.card, styles.twoColCard]}>
						<Text style={styles.cardTitle}>Site symmetry</Text>
						<Text style={styles.metricValue}>High</Text>
						<Text style={styles.mutedDesc}>
							Moisture consistent around foundation
						</Text>
					</View>
				</View>

				{/* Forecast card */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Rain forecast</Text>

					<View style={styles.graphContainer}>
						{/* Replace with your mini graph component */}
						<View style={styles.graphStub} />
					</View>

					<Text style={styles.cardDesc}>Peak rainfall ~6h</Text>
					<Text style={styles.mutedDesc}>~5.1 mm expected in next 24h</Text>
				</View>

				{/* Conditional warnings card */}
				{hasActiveWarning && (
					<View style={[styles.card, styles.warningCard]}>
						<Text style={styles.cardTitle}>{'Flood warning issued'}</Text>
						<Text style={styles.cardDesc}>Environment Canada</Text>
						<Text style={styles.mutedDesc}>Valid until Jan 1, 6:00 AM</Text>
					</View>
				)}

				{/* Recommended action card */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Recommended action</Text>
					<Text style={styles.actionPrimary}>No immediate action required</Text>
					<Text style={styles.mutedDesc}>Monitor conditions this evening</Text>
				</View>

				{/* Last updated (not a card) */}
				<Text style={styles.lastUpdated}>Last updated: 12 minutes ago</Text>
			</ScrollView>

			{/* Bottom nav is typically handled by your navigator (Tabs).
            If you render it manually, it goes here. */}
			{/* <BottomNav active="Home" /> */}
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },

	topBar: {
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 4,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	topBarSpacer: { width: 44 }, // balances icon area on right
	topBarActions: { flexDirection: 'row', gap: 10 },
	iconStub: {
		width: 34,
		height: 34,
		borderRadius: 10,
		opacity: 0.2,
		backgroundColor: '#000',
	},

	scrollContent: {
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 24,
		gap: 16,
	},

	contextBlock: { gap: 4, marginBottom: 4 },
	pageTitle: { fontSize: 20, fontWeight: '600' },
	locationText: { fontSize: 16, fontWeight: '500' },
	subtleText: { fontSize: 14, opacity: 0.75 },

	card: {
		borderRadius: 16,
		padding: 16,
		gap: 8,
		backgroundColor: 'rgba(255,255,255,0.10)', // placeholder; replace later
	},

	cardHero: {
		borderRadius: 18,
		padding: 18,
		gap: 10,
		backgroundColor: 'rgba(255,255,255,0.12)', // placeholder
	},

	cardLabel: { fontSize: 13, fontWeight: '600', opacity: 0.8 },
	cardTitle: { fontSize: 14, fontWeight: '600', opacity: 0.9 },

	heroValue: { fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
	metricValue: { fontSize: 20, fontWeight: '700' },

	cardDesc: { fontSize: 14, fontWeight: '500' },
	mutedDesc: { fontSize: 13, opacity: 0.75 },

	twoColRow: { flexDirection: 'row', gap: 12 },
	twoColCard: { flex: 1 },

	graphContainer: { paddingTop: 6, paddingBottom: 2 },
	graphStub: {
		height: 54,
		borderRadius: 12,
		opacity: 0.18,
		backgroundColor: '#000',
	},

	warningCard: {
		// later: slightly stronger border or tint, but not “buttony”
	},

	actionPrimary: { fontSize: 16, fontWeight: '700' },

	lastUpdated: {
		fontSize: 12,
		opacity: 0.7,
		marginTop: 2,
		paddingHorizontal: 4,
	},
});
