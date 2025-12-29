import { router } from 'expo-router';
import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '../../../config/theme';
import { Exclamation } from '../graphics/Icons';

interface Props {
	value: string;
	desc?: string;
	title?: string;
	isCurrent?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function CurrentRiskCard(props: Props) {
	const { title, value } = props;
	return (
		<Pressable
			style={styles.currentWrapper}
			onPress={() =>
				router.push({
					pathname: '/(tabs)/risk-levels',
					params: { level: value },
				})
			}>
			{({ pressed }) => (
				<>
					<View
						style={[styles.background, pressed && styles.backgroundPressed]}
					/>

					<View style={styles.row}>
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							<Text style={styles.title}>{title}: </Text>
							<Text style={styles.value}>{value}</Text>
						</View>
						<Exclamation color={colors.yellow} />
					</View>
				</>
			)}
		</Pressable>
	);
}

export function RiskInfoCard(props: Props) {
	const { value, desc } = props;
	return (
		<View style={styles.infoWrapper}>
			<Text style={styles.title}>{value}</Text>
			<Text style={styles.desc}>{desc}</Text>
		</View>
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
	row: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 15,
	},
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		fontFamily: 'jost',
		color: colors.black,
	},
	icon: {
		position: 'fixed',
	},
	value: {
		fontSize: 20,
		fontFamily: 'jost',
		color: colors.black,
	},
	desc: {
		fontSize: 18,
		fontFamily: 'jost',
		color: colors.black,
		marginTop: 5,
	},
	currentWrapper: {
		width: SCREEN_WIDTH * 0.9,
		height: 75,
	},
	infoWrapper: {
		backgroundColor: colors.white,
		width: SCREEN_WIDTH * 0.82,
		height: 357,
		padding: 15,
	},
});
