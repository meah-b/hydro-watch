import colors from '@/config/theme';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, {
	Defs,
	Line,
	LinearGradient,
	Path,
	Stop,
	Text,
} from 'react-native-svg';

type Point = { value: number; label: string };

type Props = {
	data: Point[];
};

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

export default function ForecastChart({ data }: Props) {
	const values = useMemo(() => data.map((d) => d.value), [data]);
	const n = Math.max(2, values.length);

	const height = 140;
	const padT = 22;
	const padB = 26;
	const plotH = height - padT - padB;

	const axisW = 35;

	const gap = 8;

	const stepX = 25;
	const plotW = stepX * (n - 1);
	const scrollW = gap + plotW;

	const { yMin, yMax, yTicks } = useMemo(() => {
		const maxV = Math.max(...values, 0);

		const step = maxV <= 2 ? 0.5 : maxV <= 6 ? 1 : 2;

		const ymin = 0;

		const headroomFactor = 1.35;
		const extraPad = step * 0.5;

		const ymax = Math.max(
			step,
			roundUpToStep(maxV * headroomFactor + extraPad, step)
		);

		const ticks = [0, 1, 2, 3].map((i) => ymin + (i / 3) * (ymax - ymin));
		return { yMin: ymin, yMax: ymax, yTicks: ticks };
	}, [values]);

	const yForValue = useCallback(
		(v: number) => {
			const t = (v - yMin) / (yMax - yMin);
			return padT + plotH - t * plotH;
		},
		[padT, plotH, yMin, yMax]
	);

	const xForIndex = useCallback((i: number) => gap + i * stepX, [gap, stepX]);

	const points = useMemo(
		() => values.map((v, i) => ({ x: xForIndex(i), y: yForValue(v) })),
		[values, xForIndex, yForValue]
	);

	const bottomY = padT + plotH;

	const gridYs = useMemo(
		() => yTicks.map((t) => yForValue(t)),
		[yTicks, yForValue]
	);

	const xLabels = useMemo(() => {
		return data
			.map((_, i) => {
				if (i % 2 === 0) return { i, text: `${i}h` };
				return null;
			})
			.filter(Boolean) as { i: number; text: string }[];
	}, [data]);

	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'flex-start',
				paddingRight: 15,
			}}>
			<Svg
				width={axisW}
				height={height}>
				<Text
					x={0}
					y={padT - 14}
					fontSize={11}
					fontWeight='700'
					fill={colors.black}
					opacity={0.55}
					textAnchor='start'>
					mm/h
				</Text>

				{gridYs.map((y, idx) => (
					<Text
						key={`yt-${idx}`}
						x={8}
						y={y + 4}
						fontSize={11}
						fontWeight='600'
						fill={colors.black}
						opacity={0.55}
						textAnchor='start'>
						{yTicks[idx].toFixed(yMax <= 2 ? 1 : 0)}
					</Text>
				))}
			</Svg>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator
				indicatorStyle='black'
				scrollIndicatorInsets={{ bottom: -4 }}
				contentContainerStyle={{ paddingRight: 10 }}>
				<Svg
					width={scrollW}
					height={height}>
					<Defs>
						<LinearGradient
							id='forecastFill'
							x1='0'
							y1='0'
							x2='0'
							y2='1'>
							<Stop
								offset='0%'
								stopColor={colors.blue200}
								stopOpacity={0.7}
							/>
							<Stop
								offset='100%'
								stopColor={colors.blue200}
								stopOpacity={0.05}
							/>
						</LinearGradient>
					</Defs>

					{gridYs.map((y, idx) => (
						<Line
							key={`gy-${idx}`}
							x1={gap}
							x2={gap + plotW}
							y1={y}
							y2={y}
							stroke='rgba(0,0,0,0.08)'
							strokeWidth={1}
						/>
					))}

					<Line
						x1={gap}
						x2={gap + plotW}
						y1={bottomY}
						y2={bottomY}
						stroke='rgba(0,0,0,0.10)'
						strokeWidth={1}
					/>

					<Path
						d={areaPath(points, bottomY)}
						fill='url(#forecastFill)'
					/>
					<Path
						d={linePath(points)}
						stroke={colors.black}
						strokeWidth={1.5}
						fill='none'
					/>

					{xLabels.map((l) => (
						<Text
							key={l.text}
							x={xForIndex(l.i)}
							y={bottomY + 22}
							fontSize={11}
							fontWeight='600'
							fill={colors.black}
							opacity={0.6}
							textAnchor='middle'>
							{l.text}
						</Text>
					))}
				</Svg>
			</ScrollView>

			<ExpoLinearGradient
				pointerEvents='none'
				colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 0 }}
				style={{
					position: 'absolute',
					right: 0,
					top: 0,
					bottom: 0,
					width: 55,
					borderTopRightRadius: 12,
					borderBottomRightRadius: 12,
				}}
			/>
		</View>
	);
}
