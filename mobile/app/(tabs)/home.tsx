import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ForecastCard from '../assets/components/cards/ForecastCard';
import SmallMetricCard, {
	LargeMetricCard,
	MediumMetricCard,
} from '../assets/components/cards/MetricCard';
import colors from '../config/theme';

export default function Analytics() {
	const hasActiveWarning = true;

	return (
		<LinearGradient
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			colors={colors.gradient}
			style={styles.root}>
			<View style={styles.topBar}>
				<View style={styles.topBarLeft}>
					<Text style={styles.pageTitle}>Overview</Text>
					<Text style={styles.locationText}>London, ON</Text>
				</View>
				<View style={styles.topBarActions}>
					<View style={styles.iconStub}>
						<Ionicons
							name='notifications-outline'
							size={24}
							color={colors.black}
							onPress={() => {}}
						/>
					</View>

					<View style={styles.iconStub}>
						<Ionicons
							name='menu'
							size={24}
							color={colors.black}
							onPress={() => {}}
						/>
					</View>
				</View>
			</View>

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				<LargeMetricCard
					title='Flood risk'
					value='MODERATE'
					desc='Elevated due to soil saturation and rainfall'
				/>

				<View style={styles.twoColRow}>
					<SmallMetricCard
						title='Soil moisture'
						value='39.5%'
						desc='Near field capacity for clay soils'
					/>

					<SmallMetricCard
						title='Site symmetry'
						value='High'
						desc='Moisture consistent around foundation'
					/>
				</View>

				<ForecastCard />

				{hasActiveWarning && (
					<MediumMetricCard
						title='Flood warning issued'
						value='Environment Canada'
						desc='Valid until Jan 1, 6:00 AM'
						isWarning={true}
					/>
				)}

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
	contextBlock: {
		gap: 4,
		marginBottom: 4,
		marginLeft: 10,
	},

	iconStub: {
		backgroundColor: colors.white,
		borderRadius: 12,
		height: 40,
		width: 40,
		opacity: 0.5,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 5,
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
	},

	pageTitle: {
		fontSize: 20,
		fontWeight: '700',
	},

	root: {
		flex: 1,
		paddingTop: 50,
	},

	scrollContent: {
		gap: 10,
		paddingBottom: 90,
		paddingHorizontal: 16,
		paddingTop: 8,
	},

	topBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 8,
	},

	topBarActions: {
		flexDirection: 'row',
		gap: 10,
	},

	topBarLeft: {
		flexDirection: 'column',
		gap: 2,
		marginLeft: 4,
	},

	twoColRow: {
		flexDirection: 'row',
		gap: 12,
	},
});
