import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import colors from '../../../config/theme';
import { PrecipChart } from '../graphics/PrecipChart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ForecastCard() {
	const values = [
		0.0, 0.0, 0.1, 0.3, 0.8, 1.2, 0.6, 0.2, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0,
		0.0, 0.4, 0.7, 0.5, 0.2, 0.0, 0.0, 0.0, 0.0,
	];
	const total24h = values.reduce((a, b) => a + b, 0);
	const valueText = `~${total24h.toFixed(1)} mm`;
	const chartValues = values.slice(0, 8);
	const data = chartValues.map((value, index) => ({
		value,
		label: index === 1 ? '2h' : index === 3 ? '4h' : index === 5 ? '6h' : '',
	}));

	return (
		<Pressable
			style={styles.wrapper}
			onPress={() => {}}>
			{({ pressed }) => (
				<>
					<View
						style={[styles.background, pressed && styles.backgroundPressed]}
					/>

					<View style={styles.content}>
						<View style={styles.row}>
							<Ionicons
								name='rainy-outline'
								size={35}
								color={colors.black}
							/>
							<Text style={styles.title}> Precipitation Forecast</Text>
						</View>
						<PrecipChart data={data} />
						<View style={styles.row}>
							<Text style={styles.subtitle}>Next 24 hours: </Text>
							<Text style={styles.value}>{valueText}</Text>
						</View>
					</View>
				</>
			)}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	background: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: colors.white,
		opacity: 0.75,
		borderRadius: 15,
	},
	backgroundPressed: {
		opacity: 0.45,
	},
	content: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'space-between',
		alignContent: 'center',
		padding: 15,
		gap: 20,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	subtitle: {
		fontSize: 18,
		fontWeight: 'bold',
		fontFamily: 'jost',
		color: colors.black,
	},
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		fontFamily: 'jost',
		color: colors.black,
		paddingLeft: 5,
	},
	value: {
		fontSize: 18,
		fontFamily: 'jost',
		color: colors.black,
	},
	wrapper: {
		width: SCREEN_WIDTH * 0.9,
		height: 240,
		borderRadius: 15,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 5,
	},
});
