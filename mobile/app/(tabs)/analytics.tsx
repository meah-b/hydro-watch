import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import colors from '../config/theme';

export default function Analytics() {
	return (
		<LinearGradient
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			colors={colors.gradient}
			style={styles.root}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}></ScrollView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	contextBlock: {
		gap: 4,
		marginBottom: 4,
		marginLeft: 10,
	},

	lastUpdated: {
		fontSize: 13,
		marginTop: 2,
		opacity: 0.75,
		paddingHorizontal: 16,
	},

	locationText: {
		fontSize: 16,
		fontWeight: '500',
		textDecorationLine: 'underline',
		marginLeft: 5,
	},

	root: {
		flex: 1,
		paddingTop: 50,
	},

	scrollContent: {
		gap: 10,
		paddingBottom: 100,
		paddingHorizontal: 16,
		paddingTop: 4,
	},

	twoColRow: {
		flexDirection: 'row',
		gap: 12,
	},
});
