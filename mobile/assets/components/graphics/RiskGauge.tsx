import colors from '@/config/theme';
import React from 'react';
import Svg, {
	Circle,
	Defs,
	G,
	Line,
	Path,
	Text,
	TextPath,
} from 'react-native-svg';

type Props = { score: number };

const clamp = (v: number) => Math.min(100, Math.max(0, v));

function polarToCartesian(cx: number, cy: number, r: number, a: number) {
	const rad = (a - 90) * (Math.PI / 180);
	return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPathCW(
	cx: number,
	cy: number,
	r: number,
	startAngle: number,
	endAngle: number
) {
	const start = polarToCartesian(cx, cy, r, startAngle);
	const end = polarToCartesian(cx, cy, r, endAngle);
	const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

	return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function Arc({
	start,
	end,
	r,
	color,
	w,
}: {
	start: number;
	end: number;
	r: number;
	color: string;
	w: number;
}) {
	const rr = r - w / 2;
	return (
		<Path
			d={arcPathCW(r, r, rr, start, end)}
			stroke={color}
			strokeWidth={w}
			fill='none'
			strokeLinecap='round'
		/>
	);
}

export default function RiskGauge({ score }: Props) {
	const strokeWidth = 18;
	const size = 220;
	const center = size / 2;

	const START = -120;
	const END = 120;
	const SWEEP = END - START;

	const clamped = clamp(score);
	const angleDeg = START + (clamped / 100) * SWEEP;

	const needleLength = 82;
	const needleEnd = polarToCartesian(center, center, needleLength, angleDeg);

	const arcRadius = center - strokeWidth / 2;
	const labelRadius = arcRadius + 15;

	const labelSpan = 65;

	const mids = [
		{ id: 'low', text: 'LOW', mid: START + 23 },
		{ id: 'moderate', text: 'MODERATE', mid: START + 70 },
		{ id: 'high', text: 'HIGH', mid: START + 142 },
		{ id: 'severe', text: 'SEVERE', mid: END - 41 },
	];

	return (
		<Svg
			width={250}
			height={200}>
			<Defs>
				{mids.map((m) => (
					<Path
						key={m.id}
						id={`label-${m.id}`}
						d={arcPathCW(
							center,
							center,
							labelRadius,
							m.mid - labelSpan / 2,
							m.mid + labelSpan / 2
						)}
						fill='none'
					/>
				))}
			</Defs>

			<G
				y={20}
				x={15}>
				<Arc
					start={-120}
					end={-60}
					r={center}
					color={colors.green200}
					w={strokeWidth}
				/>
				<Arc
					start={-60}
					end={0}
					r={center}
					color={colors.yellow100}
					w={strokeWidth}
				/>
				<Arc
					start={0}
					end={60}
					r={center}
					color={colors.orange100}
					w={strokeWidth}
				/>
				<Arc
					start={60}
					end={120}
					r={center}
					color={colors.red200}
					w={strokeWidth}
				/>

				{mids.map((m) => (
					<Text
						key={m.id}
						fill={colors.black}
						opacity={0.75}
						fontSize={11}
						fontWeight='700'
						letterSpacing={2}>
						<TextPath
							href={`#label-${m.id}`}
							startOffset='50%'
							textAnchor='middle'>
							{m.text}
						</TextPath>
					</Text>
				))}

				<Line
					x1={center}
					y1={center}
					x2={needleEnd.x}
					y2={needleEnd.y}
					stroke={colors.black}
					strokeWidth={4}
					strokeLinecap='round'
				/>

				<Circle
					cx={center}
					cy={center}
					r={8}
					fill={colors.black}
				/>
			</G>
		</Svg>
	);
}
