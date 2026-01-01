import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ForecastCard from '../assets/components/cards/ForecastCard';
import SmallMetricCard, {
	LargeMetricCard,
	MediumMetricCard,
} from '../assets/components/cards/MetricCard';
import colors from '../config/theme';

export default function Home() {
	const hasActiveWarning = true;

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
					<Text style={styles.locationText}>London, ON</Text>
				</Pressable>
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
