import colors from '@/app/config/theme';
import { SensorNode, SensorNodesMap } from '@/app/config/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

const H = 290;
const CHIP = 85;
const PAD = 12;

const severityBg = (sev: SensorNode['severity']) =>
	sev === 'Normal'
		? colors.green200
		: sev === 'Elevated'
		? colors.yellow100
		: colors.orange100;

function NodeChip({ node }: { node: SensorNode }) {
	return (
		<View style={styles.nodeChip}>
			<Text style={styles.nodeSide}>{node.side}</Text>
			<Text style={styles.nodeVal}>{node.moisture.toFixed(1)}%</Text>
			<View
				style={[
					styles.sevChip,
					{ backgroundColor: severityBg(node.severity) },
				]}>
				<Text style={styles.sevChipText}>{node.severity}</Text>
			</View>
		</View>
	);
}

export default function FoundationMoistureMap({
	nodes,
}: {
	nodes: SensorNodesMap;
}) {
	const [containerW, setContainerW] = useState(0);

	const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
		setContainerW(nativeEvent.layout.width);
	};

	const geometry = useMemo(() => {
		if (!containerW) return null;

		const cx = containerW / 2;
		const cy = H / 2;
		const half = CHIP / 2;

		const home = { x: cx, y: cy };
		const points = [
			{ x: PAD + half, y: cy },
			{ x: containerW - PAD - half, y: cy },
			{ x: cx, y: PAD + half },
			{ x: cx, y: H - PAD - half },
		];

		return { home, points };
	}, [containerW]);

	return (
		<View
			style={styles.mapWrap}
			onLayout={onLayout}>
			{!!geometry && (
				<Svg
					pointerEvents='none'
					style={StyleSheet.absoluteFill}
					width={containerW}
					height={H}>
					{geometry.points.map((p, i) => (
						<Line
							key={i}
							x1={geometry.home.x}
							y1={geometry.home.y}
							x2={p.x}
							y2={p.y}
							stroke={colors.black}
							strokeOpacity={0.14}
							strokeWidth={2}
						/>
					))}
				</Svg>
			)}

			<View style={styles.row}>
				<NodeChip node={nodes.left} />

				<View style={styles.column}>
					<NodeChip node={nodes.back} />

					<View style={styles.houseWrap}>
						<Ionicons
							name='home'
							size={40}
							color={colors.white}
							style={styles.houseIcon}
						/>
					</View>

					<NodeChip node={nodes.front} />
				</View>

				<NodeChip node={nodes.right} />
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

	houseIcon: {
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 5,
		elevation: 5,
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
