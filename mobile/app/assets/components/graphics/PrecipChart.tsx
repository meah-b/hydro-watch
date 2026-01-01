import colors from '@/app/config/theme';
import React from 'react';
import { LineChart } from 'react-native-gifted-charts';

type Props = {
	data: { value: number; label: string }[];
};

export default function PrecipChart({ data }: Props) {
	function getChartMax(values: number[]) {
		const maxVal = Math.max(...values);
		return Math.ceil(maxVal / 5) * 5;
	}

	return (
		<LineChart
			data={data}
			curved
			areaChart
			startFillColor={colors.blue200}
			endFillColor={colors.blue100}
			hideDataPoints
			yAxisThickness={0}
			xAxisThickness={0}
			noOfSections={3}
			maxValue={getChartMax(data.map((d) => d.value))}
			initialSpacing={12}
			endSpacing={12}
			height={95}
			spacing={45}
		/>
	);
}
