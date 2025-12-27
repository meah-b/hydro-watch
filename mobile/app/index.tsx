import { Image, StyleSheet, Text, View } from 'react-native';
import RiskCard from './assets/components/cards/RiskCard';
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
			<View style={styles.logoContainer}>
				<Image
					source={require('./assets/images/logo.png')}
					style={{ width: 120, height: 120 }}
				/>
				<Text style={styles.logoText}>HydroWatch</Text>
			</View>
			<View style={styles.metricCards}>
				<RiskCard
					title='Risk Level'
					value='Moderate'
					desc='Rain expected, monitor basement windows'
				/>
			</View>
			<View style={styles.bottomEllipse}>
				<BottomEllipse />
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
		textShadowOffset: { width: 0, height: 4 },
		textShadowRadius: 4,
	},
	metricCards: {
		position: 'absolute',
		top: 250,
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
