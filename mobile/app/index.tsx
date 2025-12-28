import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import ForecastCard from './assets/components/cards/ForecastCard';
import RiskCard from './assets/components/cards/RiskCard';
import SoilCard from './assets/components/cards/SoilCard';
import {
	BottomEllipse,
	TopEllipse,
} from './assets/components/graphics/EllipseShape';
import colors from './config/theme';

export default function Index() {
	return (
		<View style={styles.container}>
			<View style={styles.topEllipse}>
				<TopEllipse />
			</View>
			<View style={styles.bottomEllipse}>
				<BottomEllipse />
			</View>
			<View style={styles.logoContainer}>
				<Image
					source={require('./assets/images/logo.png')}
					style={{ width: 120, height: 120 }}
				/>
				<Text style={styles.logoText}>HydroWatch</Text>
			</View>
			<View style={styles.content}>
				<View style={{ flexDirection: 'row', alignItems: 'center' }}>
					<Ionicons
						name='location-outline'
						size={28}
						color={colors.navy}
					/>
					<Text style={styles.location}>Toronto, ON</Text>
				</View>
				<RiskCard
					title='Current Risk'
					value='Moderate'
				/>
				<View style={styles.soilCards}>
					<SoilCard
						title='Average Soil Moisture'
						value='39.5%'
					/>
					<SoilCard
						title='Soil  Asymmetry'
						value='Low'
					/>
				</View>
				<ForecastCard />
				<Text style={styles.lastUpdated}>Last Updated: 10:30 AM</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'flex-start',
		alignItems: 'center',
		backgroundColor: colors.blue100,
		overflow: 'hidden',
	},
	bottomEllipse: {
		position: 'absolute',
		bottom: -90,
	},
	location: {
		fontSize: 20,
		color: colors.navy,
		fontStyle: 'italic',
		textDecorationLine: 'underline',
	},
	lastUpdated: {
		fontSize: 20,
		color: colors.navy,
		fontStyle: 'italic',
		textAlign: 'center',
	},
	logoContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		right: 30,
		top: 90,
	},
	logoText: {
		fontSize: 40,
		fontWeight: 'bold',
		color: colors.navy,
		fontFamily: 'jost',
		textShadowColor: 'rgba(0, 0, 0, 0.25)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 2,
	},
	content: {
		marginTop: 230,
		width: '90%',
		height: 200,
		gap: 11,
	},
	soilCards: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	topEllipse: {
		position: 'absolute',
		top: -90,
		right: -110,
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		fontFamily: 'jost',
	},
	value: {
		fontSize: 20,
		fontFamily: 'jost',
	},
});
