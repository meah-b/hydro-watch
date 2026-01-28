/* global jest */
import '@testing-library/jest-native';

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), {
	virtual: true,
});

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

jest.mock('@react-native-async-storage/async-storage', () =>
	require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('aws-amplify/auth', () => ({
	fetchAuthSession: jest.fn(async () => ({
		tokens: {
			accessToken: { toString: () => 'test-access-token' },
			idToken: { toString: () => 'test-id-token' },
		},
	})),
}));

const originalWarn = console.warn;

console.warn = (...args) => {
	const msg = String(args[0] ?? '');

	if (msg.includes("shared value's .value inside reanimated inline style")) {
		return;
	}

	originalWarn(...args);
};

jest.mock('expo-router', () => {
	const React = require('react');

	return {
		__esModule: true,

		router: {
			push: jest.fn(),
			replace: jest.fn(),
			back: jest.fn(),
		},

		useLocalSearchParams: () => ({}),

		useFocusEffect: (effect) => {
			React.useEffect(() => {
				const cleanup = effect?.();
				return cleanup;
			}, [effect]);
		},
	};
});
