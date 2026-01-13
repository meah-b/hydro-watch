import colors from '@/config/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

type NotificationItem = {
	id: string;
	type: 'alert' | 'info' | 'status';
	title: string;
	body: string;
	timeLabel: string;
};

function iconForType(t: NotificationItem['type']) {
	switch (t) {
		case 'alert':
			return 'warning-outline';
		case 'status':
			return 'pulse-outline';
		default:
			return 'information-circle-outline';
	}
}

function NotificationsSection(props: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{props.title}</Text>
			<View style={styles.card}>{props.children}</View>
		</View>
	);
}

function NotificationRow(props: {
	item: NotificationItem;
	onClear: () => void;
}) {
	const { item, onClear } = props;
	const icon = iconForType(item.type);

	return (
		<View style={styles.row}>
			<View style={styles.rowLeft}>
				<View style={styles.iconWrap}>
					<Ionicons
						name={icon}
						size={18}
						color={colors.black}
					/>
				</View>

				<View style={{ flex: 1 }}>
					<View style={styles.rowTopLine}>
						<Text style={styles.rowTitle}>{item.title}</Text>
					</View>

					<Text style={styles.rowBody}>{item.body}</Text>

					<View style={styles.rowBottomLine}>
						<Text style={styles.time}>{item.timeLabel}</Text>

						<Pressable
							onPress={onClear}
							style={({ pressed }) => [
								styles.clearBtn,
								pressed ? { opacity: 0.7 } : null,
							]}>
							<Text style={styles.clearBtnText}>Clear</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</View>
	);
}

export default function Notifications() {
	const [items, setItems] = React.useState<NotificationItem[]>([
		{
			id: 'n1',
			type: 'alert',
			title: 'High risk detected',
			body: 'Soil saturation is elevated and 24h rainfall is trending up. Consider moving valuables off the floor.',
			timeLabel: '10 min ago',
		},
		{
			id: 'n2',
			type: 'status',
			title: 'Sensors reporting normally',
			body: 'All four sensors returned valid readings on the last pull.',
			timeLabel: '1 hr ago',
		},
		{
			id: 'n3',
			type: 'info',
			title: 'Forecast update',
			body: 'New Environment Canada hourly forecast was pulled and saved.',
			timeLabel: 'Today • 9:12 AM',
		},
		{
			id: 'n4',
			type: 'status',
			title: 'Background refresh completed',
			body: 'Moisture history was updated (last 6 hours).',
			timeLabel: 'Yesterday • 6:40 PM',
		},
	]);

	function clearOne(id: string) {
		setItems((prev) => prev.filter((x) => x.id !== id));
	}

	function clearAll() {
		if (items.length === 0) return;

		Alert.alert('Clear all notifications?', 'This can’t be undone.', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Clear all',
				style: 'destructive',
				onPress: () => setItems([]),
			},
		]);
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

			<View style={styles.headerRow}>
				<Text style={styles.pageTitle}>Notifications</Text>

				<Pressable
					onPress={clearAll}
					disabled={items.length === 0}
					style={({ pressed }) => [
						styles.clearAllBtn,
						items.length === 0 ? { opacity: 0.4 } : null,
						pressed && items.length > 0 ? { opacity: 0.7 } : null,
					]}>
					<Ionicons
						name='trash-outline'
						size={18}
						color={colors.black}
					/>
					<Text style={styles.clearAllText}>Clear all</Text>
				</Pressable>
			</View>

			{items.length === 0 ? (
				<View style={styles.emptyCard}>
					<Ionicons
						name='notifications-outline'
						size={28}
						color={colors.gray200}
					/>
					<Text style={styles.emptyTitle}>You’re all caught up</Text>
					<Text style={styles.emptySub}>
						New alerts and status updates will show up here.
					</Text>
				</View>
			) : (
				<NotificationsSection title='Recent'>
					{items.map((n, idx) => (
						<React.Fragment key={n.id}>
							<NotificationRow
								item={n}
								onClear={() => clearOne(n.id)}
							/>
							{idx !== items.length - 1 && <View style={styles.divider} />}
						</React.Fragment>
					))}
				</NotificationsSection>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	page: {
		flex: 1,
		paddingTop: 60,
		paddingHorizontal: 16,
	},

	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
	},

	pageTitle: {
		fontSize: 28,
		fontWeight: '700',
		color: colors.black,
		marginLeft: 4,
	},

	clearAllBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		backgroundColor: colors.white,
		borderRadius: 14,
		paddingHorizontal: 10,
		paddingVertical: 8,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 6,
		elevation: 3,
	},

	clearAllText: {
		color: colors.black,
		fontWeight: '800',
		fontSize: 13,
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
	},

	rowLeft: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
	},

	iconWrap: {
		width: 34,
		height: 34,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.gray100,
		marginTop: 1,
	},

	rowTopLine: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},

	rowTitle: {
		fontSize: 15,
		fontWeight: '800',
		color: colors.black,
		flex: 1,
	},

	pill: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 999,
	},

	pillText: {
		fontSize: 12,
		fontWeight: '800',
	},

	rowBody: {
		marginTop: 6,
		fontSize: 12,
		fontWeight: '600',
		color: colors.gray200,
		lineHeight: 16,
	},

	rowBottomLine: {
		marginTop: 10,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},

	time: {
		fontSize: 12,
		fontWeight: '700',
		color: colors.gray200,
	},

	clearBtn: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 12,
		backgroundColor: colors.gray100,
	},

	clearBtnText: {
		fontSize: 12,
		fontWeight: '800',
		color: colors.black,
	},

	divider: {
		height: 1,
		backgroundColor: colors.gray100,
	},

	emptyCard: {
		backgroundColor: colors.white,
		borderRadius: 16,
		paddingVertical: 28,
		paddingHorizontal: 16,
		alignItems: 'center',
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 10,
		elevation: 4,
	},

	emptyTitle: {
		marginTop: 10,
		fontSize: 16,
		fontWeight: '800',
		color: colors.black,
	},

	emptySub: {
		marginTop: 6,
		fontSize: 12,
		fontWeight: '600',
		color: colors.gray200,
		textAlign: 'center',
		lineHeight: 16,
	},
});
