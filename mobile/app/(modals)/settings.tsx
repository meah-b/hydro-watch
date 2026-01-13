import colors from '@/config/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { signOut } from '../../assets/utilities/auth';

type RowProps = {
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	subtitle?: string;
	right?: React.ReactNode;
	onPress?: () => void;
	isDanger?: boolean;
	disabled?: boolean;
};

function SettingsRow(props: RowProps) {
	const { icon, title, subtitle, right, onPress, isDanger, disabled } = props;

	return (
		<Pressable
			disabled={!onPress || disabled}
			onPress={onPress}
			style={({ pressed }) => [
				styles.row,
				disabled ? { opacity: 0.55 } : null,
				pressed && onPress && !disabled ? { opacity: 0.75 } : null,
			]}>
			<View style={styles.rowLeft}>
				<View
					style={[styles.iconWrap, isDanger ? styles.iconWrapDanger : null]}>
					<Ionicons
						name={icon}
						size={18}
						color={isDanger ? colors.red200 : colors.black}
					/>
				</View>

				<View style={{ flex: 1 }}>
					<Text
						style={[
							styles.rowTitle,
							isDanger ? { color: colors.red200 } : null,
						]}>
						{title}
					</Text>
					{!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
				</View>
			</View>

			<View style={styles.rowRight}>
				{right ?? (
					<Ionicons
						name='chevron-forward'
						size={18}
						color={colors.gray200}
					/>
				)}
			</View>
		</Pressable>
	);
}

function SettingsSection(props: { title: string; children: React.ReactNode }) {
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{props.title}</Text>
			<View style={styles.card}>{props.children}</View>
		</View>
	);
}

export default function Settings() {
	const [notifications, setNotifications] = React.useState(true);

	async function handleSignOut() {
		Alert.alert(
			'Sign out?',
			'You’ll need to sign in again to view risk data.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Sign out',
					style: 'destructive',
					onPress: async () => {
						await signOut();
						router.replace('/(auth)/login');
					},
				},
			]
		);
	}

	return (
		<View style={styles.page}>
			<Ionicons
				name='chevron-down-outline'
				size={32}
				color={colors.gray200}
				style={{
					position: 'absolute',
					top: 20,
					alignSelf: 'center',
					zIndex: 10,
				}}
				onPress={() => router.back()}
			/>
			<Text style={styles.pageTitle}>Settings</Text>

			<SettingsSection title='Account'>
				<SettingsRow
					icon='person-outline'
					title='Profile'
					subtitle='Manage your account details'
					onPress={() => Alert.alert('Not wired yet')}
				/>
				<View style={styles.divider} />
				<SettingsRow
					icon='lock-closed-outline'
					title='Change password'
					subtitle='Update your password anytime'
					onPress={() => Alert.alert('Not wired yet')}
				/>
			</SettingsSection>

			<SettingsSection title='Preferences'>
				<SettingsRow
					icon='notifications-outline'
					title='Notifications'
					subtitle='Flood alerts and status updates'
					right={
						<Switch
							value={notifications}
							onValueChange={setNotifications}
						/>
					}
				/>
				<View style={styles.divider} />
				<SettingsRow
					icon='checkbox-outline'
					title='Manage notifications'
					subtitle='Select which alerts to receive'
					onPress={() => Alert.alert('Not wired yet')}
				/>
			</SettingsSection>

			<SettingsSection title='HydroWatch'>
				<SettingsRow
					icon='location-outline'
					title='Site'
					subtitle='Select which home you’re monitoring'
					onPress={() => Alert.alert('Not wired yet')}
				/>
				<View style={styles.divider} />
				<SettingsRow
					icon='information-circle-outline'
					title='About'
					subtitle='Version, privacy, and acknowledgements'
					onPress={() => Alert.alert('Not wired yet')}
				/>
				<View style={styles.divider} />
				<SettingsRow
					icon='help-circle-outline'
					title='Help & support'
					subtitle='Troubleshooting and contact'
					onPress={() => Alert.alert('Not wired yet')}
				/>
			</SettingsSection>

			<View style={{ height: 10 }} />

			<View style={styles.card}>
				<SettingsRow
					icon='log-out-outline'
					title='Sign out'
					subtitle='End your current session'
					onPress={handleSignOut}
					isDanger
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	page: {
		flex: 1,
		paddingTop: 60,
		paddingHorizontal: 16,
	},

	pageTitle: {
		fontSize: 28,
		fontWeight: '700',
		color: colors.black,
		marginBottom: 8,
		marginLeft: 4,
	},

	section: {
		marginBottom: 16,
	},

	sectionTitle: {
		fontSize: 13,
		fontWeight: '700',
		color: colors.gray200,
		marginBottom: 8,
		marginLeft: 6,
		letterSpacing: 0.3,
		textTransform: 'uppercase',
	},

	card: {
		backgroundColor: colors.white,
		borderRadius: 16,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 10,
		elevation: 4,
		overflow: 'hidden',
	},

	row: {
		paddingHorizontal: 14,
		paddingVertical: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},

	rowLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1,
	},

	iconWrap: {
		width: 34,
		height: 34,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.gray100,
	},

	iconWrapDanger: {
		backgroundColor: '#ffe9e9',
	},

	rowTitle: {
		fontSize: 15,
		fontWeight: '800',
		color: colors.black,
	},

	rowSubtitle: {
		marginTop: 2,
		fontSize: 12,
		fontWeight: '600',
		color: colors.gray200,
	},

	rowRight: {
		marginLeft: 12,
	},

	divider: {
		height: 1,
		backgroundColor: colors.gray100,
	},
});
