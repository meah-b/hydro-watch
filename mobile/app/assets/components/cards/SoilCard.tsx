import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import colors from '../../../config/theme';

interface Props {
	title: string;
	value: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SoilCard(props: Props) {
	const { title, value } = props;
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
						<Text style={styles.title}>{title}: </Text>
						<Text style={styles.value}>{value}</Text>
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
		borderRadius: 15,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 5,
	},
	backgroundPressed: {
		shadowOpacity: 0.3,
		elevation: 8,
	},
	content: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 5,
	},
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		fontFamily: 'jost',
		color: colors.black,
		textAlign: 'center',
	},
	value: {
		fontSize: 20,
		fontFamily: 'jost',
		color: colors.black,
	},
	wrapper: {
		width: SCREEN_WIDTH * 0.436,
		height: 120,
	},
});
