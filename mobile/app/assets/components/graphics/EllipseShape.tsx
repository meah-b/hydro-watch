import colors from '@/app/config/theme';
import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ellipseWidth = SCREEN_WIDTH * 1.45;
const ellipseHeight = SCREEN_HEIGHT * 0.5;

export const TopEllipse = () => {
	return (
		<Svg
			width={ellipseWidth}
			height={ellipseHeight}
			viewBox='0 0 577 400'>
			<Ellipse
				cx={221.5}
				cy={200}
				rx={288.5}
				ry={200}
				fill={colors.blue200}
				opacity={0.38}
			/>
		</Svg>
	);
};

export const BottomEllipse = () => {
	return (
		<Svg
			width={ellipseWidth}
			height={ellipseHeight}
			viewBox='0 0 568 420'>
			<Ellipse
				cx={284}
				cy={210}
				rx={284}
				ry={210}
				fill={colors.blue200}
				opacity={0.35}
			/>
		</Svg>
	);
};
