import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';
import colors from '../../../config/theme';

interface Props {
	soilMoisture: string;
	siteSensitivity: string;
	siteSymmetry: string;
}
export default function HomeSoilCard(props: Props) {
	const { soilMoisture, siteSensitivity, siteSymmetry } = props;
	return (
		<Pressable
			style={styles.wrapper}
			onPress={() =>
				router.push({
					pathname: '/(tabs)/analytics',
				})
			}>
			{({ pressed }) => (
				<>
					<View
						style={[styles.background, pressed && styles.backgroundPressed]}
					/>
					<View style={styles.content}>
						<Text style={styles.title}>Site Summary</Text>
						<View style={styles.row}>
							<Text style={styles.value}>Soil Moisture:</Text>
							<View
								style={[
									styles.highlightedValue,
									{ backgroundColor: colors.green200 },
								]}>
								<Text style={styles.value}>{soilMoisture}</Text>
							</View>
						</View>
						<View style={styles.row}>
							<Text style={styles.value}>Site Sensitivity:</Text>
							<View
								style={[
									styles.highlightedValue,
									{ backgroundColor: colors.yellow200 },
								]}>
								<Text style={styles.value}>{siteSensitivity}</Text>
							</View>
						</View>
						<View style={styles.row}>
							<Text style={styles.value}>Site Symmetry:</Text>
							<View
								style={[
									styles.highlightedValue,
									{ backgroundColor: colors.green200 },
								]}>
								<Text style={styles.value}>{siteSymmetry}</Text>
							</View>
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
		alignItems: 'flex-start',
		gap: 5,
	},
	highlightedValue: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 15,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
	},
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		fontFamily: 'jost',
		color: colors.blue300,
		textAlign: 'center',
	},
	value: {
		fontSize: 20,
		fontFamily: 'jost',
		color: colors.blue300,
	},
	wrapper: {
		width: '100%',
		height: 180,
		padding: 20,
	},
});
