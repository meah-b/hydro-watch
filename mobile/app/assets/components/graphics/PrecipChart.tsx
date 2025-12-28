import React from 'react';
import { Dimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

type Props = {
	data: { value: number; label: string }[];
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PrecipChart({ data }: Props) {
	function getChartMax(values: number[]) {
		const maxVal = Math.max(...values);
		return Math.ceil(maxVal / 5) * 5;
	}

	return (
		<View>
			<LineChart
				data={data}
				curved
				areaChart
				startFillColor='rgba(51,171,230,0.25)'
				endFillColor='rgba(51,171,230,0.00)'
				hideDataPoints
				yAxisThickness={0}
				xAxisThickness={0}
				noOfSections={3}
				maxValue={getChartMax(data.map((d) => d.value))}
				initialSpacing={12}
				endSpacing={0}
				height={90}
				width={SCREEN_WIDTH * 0.7}
				spacing={45}
			/>
		</View>
	);
}
