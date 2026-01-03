import colors from '@/app/config/theme';
import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
	Defs,
	G,
	Line,
	LinearGradient,
	Path,
	Stop,
	Text,
} from 'react-native-svg';

type Props = {
	values: number[];
	fieldCapacity: number;
	saturation: number;
};

function roundDownToStep(v: number, step: number) {
	return Math.floor(v / step) * step;
}
function roundUpToStep(v: number, step: number) {
	return Math.ceil(v / step) * step;
}

function linePath(points: { x: number; y: number }[]) {
	if (points.length === 0) return '';
	return points.reduce(
		(d, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${d} L ${p.x} ${p.y}`),
		''
	);
}

function areaPath(points: { x: number; y: number }[], bottomY: number) {
	if (points.length === 0) return '';
	const first = points[0];
	const last = points[points.length - 1];
	return (
		`M ${first.x} ${bottomY} ` +
		points.map((p) => `L ${p.x} ${p.y}`).join(' ') +
		` L ${last.x} ${bottomY} Z`
	);
}

export default function SoilMoistureChartSvg({
	values,
	fieldCapacity,
	saturation,
}: Props) {
	const n = Math.max(2, values.length);

	const width = 280;
	const height = 120;
	const padL = 45;
	const padT = 15;
	const padB = 20;
	const chartOffsetX = -40;

	const plotW = width - padL + 15;
	const plotH = height - padT - padB;

	const { yMin, yMax } = useMemo(() => {
		const minV = Math.min(...values, fieldCapacity, saturation);
		const maxV = Math.max(...values, fieldCapacity, saturation);

		const rawMin = minV - 0.8;
		const rawMax = maxV + 0.8;

		return {
			yMin: roundDownToStep(rawMin, 1),
			yMax: roundUpToStep(rawMax, 1),
		};
	}, [values, fieldCapacity, saturation]);

	const xForIndex = useCallback(
		(i: number) => padL + chartOffsetX + (i / (values.length - 1)) * plotW,
		[padL, plotW, values.length, chartOffsetX]
	);

	const yForValue = useCallback(
		(v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH,
		[padT, plotH, yMin, yMax]
	);

	const points = useMemo(
		() => values.map((v, i) => ({ x: xForIndex(i), y: yForValue(v) })),
		[values, xForIndex, yForValue]
	);

	const yFC = yForValue(fieldCapacity);
	const ySAT = yForValue(saturation);
	const bottomY = padT + plotH;

	const grid = [0.25, 0.5, 0.75].map((t) => padT + t * plotH);

	const idx4h = Math.round((n - 1) * (2 / 6));
	const idx2h = Math.round((n - 1) * (4 / 6));
	const xLabels = [
		{ i: 0.6, text: '6h' },
		{ i: idx4h, text: '4h' },
		{ i: idx2h, text: '2h' },
		{ i: n - 2.2, text: 'Now' },
	];

	return (
		<View>
			<Svg
				width={width + chartOffsetX + 80}
				height={height}>
				<Defs>
					<LinearGradient
						id='soilFill'
						x1='0'
						y1='0'
						x2='0'
						y2='1'>
						<Stop
							offset='0%'
							stopColor={colors.blue200}
							stopOpacity={1}
						/>
						<Stop
							offset='100%'
							stopColor={colors.blue200}
							stopOpacity={0.05}
						/>
					</LinearGradient>
				</Defs>

				{grid.map((y, k) => (
					<Line
						key={k}
						x1={padL + chartOffsetX}
						x2={padL + plotW + chartOffsetX}
						y1={y}
						y2={y}
						stroke='rgba(0,0,0,0.08)'
						strokeWidth={1}
					/>
				))}

				<Line
					x1={padL + chartOffsetX}
					x2={padL + plotW + chartOffsetX}
					y1={yFC}
					y2={yFC}
					stroke='rgba(0,0,0,0.75)'
					strokeWidth={1}
					strokeDasharray='6 4'
				/>
				<Line
					x1={padL + chartOffsetX}
					x2={padL + plotW + chartOffsetX}
					y1={ySAT}
					y2={ySAT}
					stroke='rgba(0,0,0,0.75)'
					strokeWidth={1}
					strokeDasharray='6 4'
					opacity={0.85}
				/>

				<Path
					d={areaPath(points, bottomY)}
					fill='url(#soilFill)'
				/>

				<Path
					d={linePath(points)}
					stroke={colors.black}
					strokeWidth={1}
					fill='none'
				/>

				<Text
					x={padL + plotW + chartOffsetX + 10}
					y={yFC + 3}
					fontSize={11}
					fontWeight='700'
					fill={colors.black}
					opacity={0.6}
					textAnchor='start'>
					FC {fieldCapacity}%
				</Text>
				<Text
					x={padL + plotW + chartOffsetX + 10}
					y={ySAT + 3}
					fontSize={11}
					fontWeight='700'
					fill={colors.black}
					opacity={0.6}
					textAnchor='start'>
					SAT {saturation}%
				</Text>

				<G>
					{xLabels.map((l) => (
						<Text
							key={l.text}
							x={xForIndex(l.i)}
							y={padT + plotH + 16}
							fontSize={11}
							fontWeight='600'
							fill={colors.black}
							opacity={0.65}
							textAnchor='middle'>
							{l.text}
						</Text>
					))}
				</G>
			</Svg>
		</View>
	);
}
