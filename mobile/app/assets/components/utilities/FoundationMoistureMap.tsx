import colors from '@/app/config/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

type Severity = 'Normal' | 'Elevated' | 'High';

function NodeChip({
	n,
}: {
	n: { side: string; value: number; sev: Severity };
}) {
	const bg =
		n.sev === 'Normal'
			? colors.green200
			: n.sev === 'Elevated'
			? colors.yellow100
			: colors.orange100;

	return (
		<View style={styles.nodeChip}>
			<Text style={styles.nodeSide}>{n.side}</Text>
			<Text style={styles.nodeVal}>{n.value.toFixed(1)}%</Text>
			<View style={[styles.sevChip, { backgroundColor: bg }]}>
				<Text style={styles.sevChipText}>{n.sev}</Text>
			</View>
		</View>
	);
}

type Node = {
	side: 'Front' | 'Back' | 'Right' | 'Left';
	value: number;
	sev: Severity;
};

type Props = {
	nodes: Node[];
};

export default function FoundationMoistureMap({ nodes }: Props) {
	const [containerW, setContainerW] = useState(0);

	const bySide = useMemo(() => {
		const m = new Map<Node['side'], Node>();
		nodes.forEach((n) => m.set(n.side, n));
		return m;
	}, [nodes]);

	const ordered: Node[] = (['Front', 'Left', 'Back', 'Right'] as const)
		.map((s) => bySide.get(s))
		.filter(Boolean) as Node[];

	const onLayout = (e: LayoutChangeEvent) => {
		setContainerW(e.nativeEvent.layout.width);
	};

	const H = 290;
	const chip = 85;
	const pad = 12;

	const cx = containerW / 2;
	const cy = H / 2;

	const left = { x: pad + chip / 2, y: cy };
	const right = { x: containerW - pad - chip / 2, y: cy };
	const top = { x: cx, y: pad + chip / 2 };
	const bottom = { x: cx, y: H - pad - chip / 2 };

	const home = { x: cx, y: cy };

	return (
		<View
			style={styles.mapWrap}
			onLayout={onLayout}>
			{containerW > 0 && (
				<Svg
					pointerEvents='none'
					style={StyleSheet.absoluteFill}
					width={containerW}
					height={H}>
					<Line
						x1={home.x}
						y1={home.y}
						x2={left.x}
						y2={left.y}
						stroke={colors.black}
						strokeOpacity={0.14}
						strokeWidth={2}
					/>
					<Line
						x1={home.x}
						y1={home.y}
						x2={right.x}
						y2={right.y}
						stroke={colors.black}
						strokeOpacity={0.14}
						strokeWidth={2}
					/>
					<Line
						x1={home.x}
						y1={home.y}
						x2={top.x}
						y2={top.y}
						stroke={colors.black}
						strokeOpacity={0.14}
						strokeWidth={2}
					/>
					<Line
						x1={home.x}
						y1={home.y}
						x2={bottom.x}
						y2={bottom.y}
						stroke={colors.black}
						strokeOpacity={0.14}
						strokeWidth={2}
					/>
				</Svg>
			)}

			<View style={styles.row}>
				<NodeChip n={ordered[1]} />

				<View style={styles.column}>
					<NodeChip n={ordered[2]} />
					<View style={styles.houseWrap}>
						<Ionicons
							name='home'
							size={40}
							color={colors.white}
							style={{
								shadowColor: colors.black,
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.2,
								shadowRadius: 5,
								elevation: 5,
							}}
						/>
					</View>
					<NodeChip n={ordered[0]} />
				</View>

				<NodeChip n={ordered[3]} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	column: {
		alignItems: 'center',
		justifyContent: 'space-between',
		height: 290,
	},

	houseWrap: {
		alignItems: 'center',
		justifyContent: 'center',
		height: 85,
		width: 85,
		borderRadius: 14,
		backgroundColor: colors.blue100,
		borderWidth: 1,
		borderColor: 'rgba(0,0,0,0.08)',
		minWidth: 76,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 5,
	},

	mapWrap: {
		height: 290,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},

	nodeChip: {
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		height: 85,
		width: 85,
		borderRadius: 14,
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: 'rgba(0,0,0,0.08)',
		minWidth: 76,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 5,
	},

	nodeSide: {
		fontSize: 12,
		fontWeight: '800',
		opacity: 0.7,
	},

	nodeVal: {
		fontSize: 13,
		fontWeight: '900',
		opacity: 0.9,
	},

	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
		paddingHorizontal: 12,
	},

	sevChip: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 50,
	},

	sevChipText: {
		fontSize: 11,
		fontWeight: '800',
		opacity: 0.85,
	},
});
