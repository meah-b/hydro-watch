import Home from '@/app/(tabs)/home';
import { getLatestSiteState } from '@/assets/utilities/getLatestSiteState';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { RefreshControl } from 'react-native';

import { router } from 'expo-router';
import { makeSiteState } from '../fixtures/siteState';

jest.mock('@/assets/utilities/getLatestSiteState', () => ({
	getLatestSiteState: jest.fn(),
}));

jest.mock('expo-router', () => ({
	router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
	useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('@/assets/components/screens/loading', () => {
	const React = jest.requireActual('react');
	const { Text, View } = jest.requireActual('react-native');
	return function LoadingScreenMock(props: {
		state: string;
		error?: string | null;
	}) {
		return (
			<View>
				<Text>{props.state === 'loading' ? 'LOADING' : 'ERROR'}</Text>
				{props.error ? <Text>{props.error}</Text> : null}
			</View>
		);
	};
});

jest.mock('@/assets/components/cards/ForecastCard', () => {
	const React = jest.requireActual('react');
	const { View, Text, Pressable } = jest.requireActual('react-native');
	return function ForecastCardMock(props: any) {
		return (
			<Pressable
				onPress={props.onPress}
				testID='ForecastCard'>
				<View>
					<Text>Precipitation Forecast</Text>
					<Text>{`Next 24 hours: ~${Number(props.total24hMm ?? 0).toFixed(1)} mm`}</Text>
				</View>
			</Pressable>
		);
	};
});

jest.mock('@/assets/components/cards/MetricCard', () => {
	const React = jest.requireActual('react');
	const { Pressable, Text, View } = jest.requireActual('react-native');

	function Card(props: any) {
		const { title, value, desc, onPress } = props;
		const testID = `card:${String(title).replace(/\s+/g, '_')}`;

		return (
			<Pressable
				testID={testID}
				accessibilityRole='button'
				onPress={onPress}>
				<View>
					<Text>{title}</Text>
					<Text>{value}</Text>
					{desc ? <Text>{desc}</Text> : null}
				</View>
			</Pressable>
		);
	}

	return {
		__esModule: true,
		default: Card,
		LargeMetricCard: Card,
		MediumMetricCard: Card,
	};
});

const mockGetLatestSiteState = getLatestSiteState as jest.Mock;
const mockRouterPush = router.push as jest.Mock;

describe('Home screen', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('shows loading initially', async () => {
		mockGetLatestSiteState.mockImplementation(() => new Promise(() => {}));

		const { getByText } = render(<Home />);
		expect(getByText('LOADING')).toBeTruthy();
	});

	it('shows error state when load fails', async () => {
		mockGetLatestSiteState.mockRejectedValue(new Error('boom'));

		const { getByText } = render(<Home />);

		await waitFor(() => expect(getByText('ERROR')).toBeTruthy());
		expect(getByText('boom')).toBeTruthy();
	});

	it('shows error state when API returns null/empty state', async () => {
		mockGetLatestSiteState.mockResolvedValue(null);

		const { getByText } = render(<Home />);
		await waitFor(() => expect(getByText('ERROR')).toBeTruthy());
	});

	it('renders key sections after load', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState({ risk_score: 70 }));

		const { getByText } = render(<Home />);

		await waitFor(() => expect(getByText('Flood risk')).toBeTruthy());
		expect(getByText('Soil moisture')).toBeTruthy();
		expect(getByText('Site symmetry')).toBeTruthy();
		expect(getByText('Sensor Status')).toBeTruthy();
		expect(getByText('Precipitation Forecast')).toBeTruthy();
	});

	it('maps risk_score to LOW', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState({ risk_score: 10 }));

		const { getByText } = render(<Home />);
		await waitFor(() => expect(getByText('Flood risk')).toBeTruthy());

		expect(getByText('LOW')).toBeTruthy();
	});

	it('maps risk_score to MODERATE', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState({ risk_score: 45 }));

		const { getByText } = render(<Home />);
		await waitFor(() => expect(getByText('Flood risk')).toBeTruthy());

		expect(getByText('MODERATE')).toBeTruthy();
	});

	it('maps risk_score to HIGH', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState({ risk_score: 70 }));

		const { getByText } = render(<Home />);
		await waitFor(() => expect(getByText('Flood risk')).toBeTruthy());

		expect(getByText('HIGH')).toBeTruthy();
	});

	it('maps risk_score to SEVERE', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState({ risk_score: 95 }));

		const { getByText } = render(<Home />);
		await waitFor(() => expect(getByText('Flood risk')).toBeTruthy());

		expect(getByText('SEVERE')).toBeTruthy();
	});

	it('sensor status: unavailable when qc_report missing', async () => {
		mockGetLatestSiteState.mockResolvedValue(
			makeSiteState({ qc_report: undefined as any }),
		);

		const { getByText } = render(<Home />);
		await waitFor(() => expect(getByText('Sensor Status')).toBeTruthy());

		expect(getByText('Sensor status unavailable.')).toBeTruthy();
	});

	it('sensor status: reporting normally when all sensors present + normal', async () => {
		mockGetLatestSiteState.mockResolvedValue(
			makeSiteState({
				qc_report: {
					all_sensors_present: true,
					all_sensors_normal: true,
					valid_samples_kept: { front: [1], back: [1], left: [1], right: [1] },
				} as any,
			}),
		);

		const { getByText } = render(<Home />);
		await waitFor(() => expect(getByText('Sensor Status')).toBeTruthy());

		expect(getByText('4/4 sensors reporting normally.')).toBeTruthy();
	});

	it('sensor status: active but adjusted when all present but not all normal', async () => {
		mockGetLatestSiteState.mockResolvedValue(
			makeSiteState({
				qc_report: {
					all_sensors_present: true,
					all_sensors_normal: false,
					fallback_sensors: ['left'],
					invalid_samples_removed: { front: [0] },
				} as any,
			}),
		);

		const { getByText } = render(<Home />);
		await waitFor(() => expect(getByText('Sensor Status')).toBeTruthy());

		expect(getByText(/4\/4 sensors active, data adjusted/i)).toBeTruthy();
	});

	it('sensor status: shows available count when missing/failed sensors', async () => {
		mockGetLatestSiteState.mockResolvedValue(
			makeSiteState({
				qc_report: {
					all_sensors_present: false,
					missing_sensors: [],
					failed_sensors: ['front'],
				} as any,
			}),
		);

		const { getByText } = render(<Home />);
		await waitFor(() => expect(getByText('Sensor Status')).toBeTruthy());

		expect(
			getByText('3/4 sensors available ( 0 missing, 1 failed )'),
		).toBeTruthy();
	});

	it('pull-to-refresh calls getLatestSiteState again', async () => {
		mockGetLatestSiteState
			.mockResolvedValueOnce(makeSiteState({ risk_score: 40 }))
			.mockResolvedValueOnce(makeSiteState({ risk_score: 85 }));

		const { getByText, UNSAFE_getByType } = render(<Home />);
		await waitFor(() => expect(getByText('Flood risk')).toBeTruthy());

		const rc = UNSAFE_getByType(RefreshControl);

		await act(async () => {
			await rc.props.onRefresh();
		});

		expect(mockGetLatestSiteState).toHaveBeenCalledTimes(2);
	});

	it('navigates to Risk when Flood risk card pressed', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState({ risk_score: 70 }));

		const { getByTestId } = render(<Home />);
		await waitFor(() => expect(getByTestId('card:Flood_risk')).toBeTruthy());

		fireEvent.press(getByTestId('card:Flood_risk'));
		expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/risk');
	});

	it('navigates to Insights (trend) when Soil moisture pressed', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState());

		const { getByTestId } = render(<Home />);
		await waitFor(() => expect(getByTestId('card:Soil_moisture')).toBeTruthy());

		fireEvent.press(getByTestId('card:Soil_moisture'));
		expect(mockRouterPush).toHaveBeenCalledWith({
			pathname: '/(tabs)/insights',
			params: { scrollTo: 'trend' },
		});
	});

	it('navigates to Insights (foundation) when Site symmetry pressed', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState());

		const { getByTestId } = render(<Home />);
		await waitFor(() => expect(getByTestId('card:Site_symmetry')).toBeTruthy());

		fireEvent.press(getByTestId('card:Site_symmetry'));
		expect(mockRouterPush).toHaveBeenCalledWith({
			pathname: '/(tabs)/insights',
			params: { scrollTo: 'foundation' },
		});
	});

	it('navigates to Insights (rain) when ForecastCard pressed', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState());

		const { getByTestId, getByText } = render(<Home />);
		await waitFor(() =>
			expect(getByText('Precipitation Forecast')).toBeTruthy(),
		);

		fireEvent.press(getByTestId('ForecastCard'));
		expect(mockRouterPush).toHaveBeenCalledWith({
			pathname: '/(tabs)/insights',
			params: { scrollTo: 'rain' },
		});
	});
});
