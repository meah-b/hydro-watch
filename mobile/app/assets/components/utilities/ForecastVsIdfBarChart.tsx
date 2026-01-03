import colors from '@/app/config/theme';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

type Props = {
	forecastMm: number;
	idfMm: number;
};

function roundUpNice(v: number) {
	if (v <= 0) return 1;
	const pow = Math.pow(10, Math.floor(Math.log10(v)));
	const n = v / pow;
	const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
	return nice * pow;
}

export default function ForecastVsIdfBarChart({ forecastMm, idfMm }: Props) {
	const width = 280;
	const height = 140;
	const padT = 16;
	const padB = 28;

	const plotH = height - padT - padB;

	const yMax = useMemo(() => {
		const maxV = Math.max(forecastMm, idfMm, 0);
		return roundUpNice(maxV * 1.15 + 0.5);
	}, [forecastMm, idfMm]);

	const yFor = (v: number) => padT + (1 - v / (yMax || 1)) * plotH;

	const bottomY = padT + plotH;

	const barW = Math.min(64, width / 3);
	const gap = (width - 2 * barW) / 3;

	const x1 = gap;
	const x2 = gap * 2 + barW;
	const yForecast = yFor(Math.max(0, forecastMm));
	const yIdf = yFor(Math.max(0, idfMm));

	const hForecast = bottomY - yForecast;
	const hIdf = bottomY - yIdf;

	const gridYs = [0.33, 0.66].map((t) => padT + t * plotH);

	const fmt = (v: number) => `${v.toFixed(1)} mm`;

	return (
		<View style={{ width, height }}>
			<Svg
				width={width}
				height={height}>
				{gridYs.map((y, i) => (
					<Line
						key={i}
						x1={0}
						x2={width}
						y1={y}
						y2={y}
						stroke='rgba(0,0,0,0.08)'
						strokeWidth={1}
					/>
				))}

				<Line
					x1={0}
					x2={width}
					y1={bottomY}
					y2={bottomY}
					stroke='rgba(0,0,0,0.12)'
					strokeWidth={1}
				/>

				<G>
					<Rect
						x={x1}
						y={yForecast}
						width={barW}
						height={hForecast}
						rx={2}
						fill={colors.blue200}
						opacity={0.85}
					/>

					<Rect
						x={x2}
						y={yIdf}
						width={barW}
						height={hIdf}
						rx={2}
						fill={colors.black}
						opacity={0.18}
					/>

					<SvgText
						x={x1 + barW / 2}
						y={yForecast - 6}
						fontSize={11}
						fontWeight='700'
						fill={colors.black}
						opacity={0.75}
						textAnchor='middle'>
						{fmt(forecastMm)}
					</SvgText>

					<SvgText
						x={x2 + barW / 2}
						y={yIdf - 6}
						fontSize={11}
						fontWeight='700'
						fill={colors.black}
						opacity={0.75}
						textAnchor='middle'>
						{fmt(idfMm)}
					</SvgText>

					<SvgText
						x={x1 + barW / 2}
						y={height - 10}
						fontSize={11}
						fontWeight='600'
						fill={colors.black}
						opacity={0.65}
						textAnchor='middle'>
						Forecast (24h)
					</SvgText>

					<SvgText
						x={x2 + barW / 2}
						y={height - 10}
						fontSize={11}
						fontWeight='600'
						fill={colors.black}
						opacity={0.65}
						textAnchor='middle'>
						IDF (24h)
					</SvgText>
				</G>
			</Svg>
		</View>
	);
}
