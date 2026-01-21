/* global jest */
import '@testing-library/jest-native';

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), {
	virtual: true,
});

jest.mock('expo-router', () => ({
	router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
	useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('expo-linear-gradient', () => {
	const React = require('react');
	const { View } = require('react-native');
	return {
		LinearGradient: ({ children, ...props }) => (
			<View {...props}>{children}</View>
		),
	};
});

jest.mock('@/assets/components/graphics/RiskGauge', () => {
	const React = require('react');
	const { View } = require('react-native');

	const RiskGaugeMock = () => <View testID='RiskGauge' />;
	RiskGaugeMock.displayName = 'RiskGaugeMock';

	return RiskGaugeMock;
});

jest.mock('@/assets/components/graphics/SoilMoistureChart', () => {
	const React = require('react');
	const { View } = require('react-native');

	const SoilMoistureChartMock = () => <View testID='SoilMoistureChart' />;
	SoilMoistureChartMock.displayName = 'SoilMoistureChartMock';

	return SoilMoistureChartMock;
});

jest.mock('@/assets/components/graphics/FoundationMoistureMap', () => {
	const React = require('react');
	const { View } = require('react-native');

	const FoundationMoistureMapMock = () => (
		<View testID='FoundationMoistureMap' />
	);
	FoundationMoistureMapMock.displayName = 'FoundationMoistureMapMock';

	return FoundationMoistureMapMock;
});

jest.mock('@/assets/components/graphics/ForecastVsIdfBarChart', () => {
	const React = require('react');
	const { View } = require('react-native');

	const ForecastVsIdfBarChartMock = () => (
		<View testID='ForecastVsIdfBarChart' />
	);
	ForecastVsIdfBarChartMock.displayName = 'ForecastVsIdfBarChartMock';

	return ForecastVsIdfBarChartMock;
});
