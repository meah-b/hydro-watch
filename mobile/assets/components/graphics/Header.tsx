import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '../../../config/theme';

type Props = {
	onPressNotifications: () => void;
	onPressSettings: () => void;
};

export default function AppHeader({
	onPressNotifications,
	onPressSettings,
}: Props) {
	return (
		<View style={styles.topBar}>
			<View style={styles.logoBlock}>
				<Image
					source={require('../../../assets/images/black-shadow-logo.png')}
					style={styles.logo}
				/>
				<Text style={styles.pageTitle}>HydroWatch</Text>
			</View>

			<View style={styles.topBarActions}>
				<Pressable
					onPress={onPressNotifications}
					style={({ pressed }) => [
						styles.iconStub,
						{ opacity: pressed ? 0.5 : 1 },
					]}>
					<Ionicons
						name='notifications-outline'
						size={24}
						color={colors.black}
					/>
				</Pressable>

				<Pressable
					onPress={onPressSettings}
					style={({ pressed }) => [
						styles.iconStub,
						{ opacity: pressed ? 0.5 : 1 },
					]}>
					<Ionicons
						name='settings-outline'
						size={24}
						color={colors.black}
					/>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	topBar: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		marginTop: 10,
		backgroundColor: 'transparent',
		height: 80,
	},

	logoBlock: {
		flexDirection: 'row',
		alignItems: 'center',
	},

	logo: {
		width: 37,
		height: 37,
		marginRight: 5,
		marginTop: 2,
	},

	pageTitle: {
		fontSize: 25,
		fontWeight: '600',
		color: colors.black,
	},

	topBarActions: {
		flexDirection: 'row',
		gap: 10,
	},

	iconStub: {
		backgroundColor: colors.white,
		borderRadius: 12,
		height: 40,
		width: 40,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 5,
	},
});
