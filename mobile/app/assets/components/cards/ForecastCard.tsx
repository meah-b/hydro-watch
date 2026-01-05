import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import colors from '../../../config/theme';
import ForecastChart from '../utilities/ForecastChart';

export default function ForecastCard() {
	const values = [
		0.0, 0.0, 0.1, 0.2, 0.2, 0.2, 0.3, 0.2, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
		0.1, 0.1, 0.2, 0.3, 0.1, 0.0, 0.0, 0.0, 0.0,
	];
	const total24h = values.reduce((a, b) => a + b, 0);
	const valueText = `~${total24h.toFixed(1)} mm`;
	const data = values.map((value, index) => ({
		value,
		label: `${index + 1}h`,
	}));

	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}> Precipitation Forecast</Text>
			<View style={styles.chartClip}>
				<ForecastChart data={data} />
			</View>
			<Text style={styles.cardTitle}>Next 24 hours: {valueText}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		padding: 18,
		height: 240,
		backgroundColor: colors.white,
		borderRadius: 15,
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

	chartClip: {
		width: '100%',
		overflow: 'hidden',
		marginLeft: 5,
	},
});
