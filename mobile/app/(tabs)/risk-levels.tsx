import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { RiskLevelCard } from '../assets/components/cards/MetricCard';
import RiskBar from '../assets/components/graphics/RiskBar';
import colors from '../config/theme';

const BAR_HEIGHT = 1413;
const ICON_SIZE = 34;

const riskToY = (risk: number) => {
	return (risk / 100) * BAR_HEIGHT - 2;
};

export default function RiskLevels() {
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Risk Levels</Text>
				<Ionicons
					name='information-circle'
					size={40}
					color={colors.blue300}
					style={styles.infoIcon}
					onPress={() => {}}
				/>
			</View>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.content}>
				<RiskBar />
				<View style={styles.needleIcon}>
					<FontAwesome6
						name='location-pin'
						size={ICON_SIZE}
						color={colors.blue300}
						style={{ transform: [{ rotate: '-90deg' }] }}
					/>
				</View>
				<View style={styles.infoCards}>
					<RiskLevelCard
						desc='Example description for low risk level.'
						value='Low'
					/>
					<Svg
						height={2}
						width='100%'>
						<Line
							x1='0'
							y1='1'
							x2='100%'
							y2='1'
							stroke={colors.black}
							strokeWidth='3'
							strokeDasharray='6,4'
						/>
					</Svg>
					<RiskLevelCard
						desc='Example description for moderate risk level.'
						value='Moderate'
					/>
					<Svg
						height={2}
						width='100%'>
						<Line
							x1='0'
							y1='1'
							x2='100%'
							y2='1'
							stroke={colors.black}
							strokeWidth='3'
							strokeDasharray='6,4'
						/>
					</Svg>
					<RiskLevelCard
						desc='Example description for high risk level.'
						value='High'
					/>
					<Svg
						height={2}
						width='100%'>
						<Line
							x1='0'
							y1='1'
							x2='100%'
							y2='1'
							stroke={colors.black}
							strokeWidth='3'
							strokeDasharray='6,4'
						/>
					</Svg>
					<RiskLevelCard
						desc='Example description for severe risk level.'
						value='Severe'
					/>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'flex-start',
		alignItems: 'center',
		backgroundColor: colors.blue100,
	},
	content: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		paddingBottom: 85,
		paddingTop: 5,
		paddingHorizontal: 20,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '91%',
		marginTop: 75,
	},
	infoCards: {
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
	},
	needleIcon: {
		position: 'absolute',
		left: 20,
		top: riskToY(33),
		flexDirection: 'row',
		shadowColor: 'black',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 5,
		elevation: 5,
	},
	infoIcon: {
		shadowColor: 'black',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 5,
		elevation: 5,
	},
	title: {
		fontSize: 40,
		fontWeight: 'bold',
		color: colors.blue300,
		fontFamily: 'jost',
		textShadowColor: 'rgba(0, 0, 0, 0.25)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 2,
	},
	scrollView: {
		marginTop: 25,
		width: '100%',
	},
});
