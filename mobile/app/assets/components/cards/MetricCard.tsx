import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
	Dimensions,
	Linking,
	Pressable,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import colors from '../../../config/theme';

interface MetricCardProps {
	title: string;
	value: string;
	desc: string;
	isWarning?: boolean;
}

interface RiskLevelCardProps {
	riskLevel: string;
	desc: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SmallMetricCard(props: MetricCardProps) {
	const { title, value, desc } = props;

	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}>{title}</Text>
			<Text style={styles.metricValue}>{value}</Text>
			<Text style={styles.mutedDesc}>{desc}</Text>
		</View>
	);
}

export function MediumMetricCard(props: MetricCardProps) {
	const { title, value, desc, isWarning } = props;

	const handlePress = () => {
		Linking.openURL('https://weather.gc.ca/warnings');
	};

	return (
		<View style={[styles.card, isWarning ? styles.warningCard : null]}>
			<Text style={styles.cardTitle}>{title}</Text>

			{isWarning ? (
				<Pressable
					onPress={handlePress}
					style={({ pressed }) => [
						styles.linkWrapper,
						{ opacity: pressed ? 0.6 : 1 },
					]}>
					<Text style={[styles.actionPrimary, styles.actionLink]}>{value}</Text>
					<Ionicons
						name='open-outline'
						size={20}
					/>
				</Pressable>
			) : (
				<Text style={styles.actionPrimary}>{value}</Text>
			)}

			<Text style={styles.mutedDesc}>{desc}</Text>
		</View>
	);
}

export function LargeMetricCard(props: MetricCardProps) {
	const { title, value, desc } = props;

	return (
		<View style={styles.card}>
			<Text style={styles.cardLabel}>{title}</Text>
			<Text style={styles.heroValue}>{value}</Text>
			<Text style={styles.cardDesc}>{desc}</Text>
		</View>
	);
}

export function RiskLevelCard(props: RiskLevelCardProps) {
	const { riskLevel, desc } = props;

	return (
		<View style={styles.infoCard}>
			<Text style={styles.infoCardTitle}>{riskLevel}</Text>
			<Text style={styles.desc}>{desc}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	actionLink: {
		textDecorationLine: 'underline',
	},

	actionPrimary: {
		fontSize: 16,
		fontWeight: '700',
	},

	card: {
		flex: 1,
		borderRadius: 16,
		padding: 18,
		gap: 8,
		backgroundColor: colors.white,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 5,
	},

	cardDesc: {
		fontSize: 14,
		fontWeight: '500',
	},

	cardLabel: {
		fontSize: 13,
		fontWeight: '600',
		opacity: 0.8,
	},

	cardTitle: {
		fontSize: 14,
		fontWeight: '600',
		opacity: 0.9,
	},

	desc: {
		fontSize: 18,
		fontFamily: 'jost',
		color: colors.blue300,
		marginTop: 5,
	},

	heroValue: {
		fontSize: 28,
		fontWeight: '800',
		letterSpacing: 0.5,
	},

	linkWrapper: {
		alignSelf: 'flex-start',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},

	metricValue: {
		fontSize: 20,
		fontWeight: '700',
	},

	mutedDesc: {
		fontSize: 13,
		opacity: 0.75,
	},

	infoCard: {
		backgroundColor: colors.white,
		width: SCREEN_WIDTH * 0.82,
		height: 357,
		padding: 15,
	},

	infoCardTitle: {
		fontSize: 22,
		fontWeight: 'bold',
		fontFamily: 'jost',
		color: colors.blue300,
	},

	warningCard: {
		backgroundColor: colors.red100,
	},
});
