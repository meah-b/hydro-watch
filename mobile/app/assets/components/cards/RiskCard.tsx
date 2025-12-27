import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import colors from '../../../config/theme';

interface Props {
	title: string;
	value: string;
	desc: string;
}

export default function RiskCard(props: Props) {
	const { title, value, desc } = props;
	return (
		<View style={styles.wrapper}>
			<View style={styles.background} />
			<View style={styles.content}>
				<View style={styles.row}>
					<Text style={styles.title}>{title}: </Text>
					<Text style={styles.value}>{value}</Text>
				</View>
				<Text style={styles.desc}>{desc}</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	background: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: colors.white,
		opacity: 0.7,
		borderRadius: 15,
	},
	content: {
		flexDirection: 'column',
		justifyContent: 'center',
		paddingHorizontal: 20,
		paddingVertical: 15,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		fontFamily: 'jost',
		color: colors.black,
	},
	value: {
		fontSize: 20,
		fontStyle: 'italic',
		color: colors.black,
	},
	desc: {
		fontSize: 14,
		fontFamily: 'jost',
		color: colors.gray,
		marginTop: 12,
	},
	wrapper: {
		width: 350,
		height: 93,
		borderRadius: 15,
		marginVertical: 5,
		marginHorizontal: 10,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 5,
	},
});
