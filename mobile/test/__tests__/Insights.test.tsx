import { render, waitFor } from '@testing-library/react-native';
import { act } from 'react';
import { RefreshControl } from 'react-native';

import { getLatestSiteState } from '@/assets/utilities/getLatestSiteState';
import getSiteConfig from '@/assets/utilities/getSiteConfig';
import getMoisture6hRows from '@/assets/utilities/getSoilMoistureHistory';

import Insights from '@/app/(tabs)/insights';
import getSensorStatus from '@/assets/utilities/getSensorStatus';
import { makeMoistureRows } from '../fixtures/moistureRows';
import { makeSiteConfig } from '../fixtures/siteConfig';
import { makeSiteState } from '../fixtures/siteState';

jest.mock('@/assets/components/screens/loading', () => {
	const React = jest.requireActual('react');
	const { Text } = jest.requireActual('react-native');
	return function LoadingScreenMock(props: any) {
		return <Text>{props.error ?? props.state}</Text>;
	};
});

jest.mock('../../assets/components/graphics/FoundationMoistureMap', () => {
	const React = jest.requireActual('react');
	const { View } = jest.requireActual('react-native');
	return function FoundationMoistureMapMock() {
		return <View testID='FoundationMoistureMap' />;
	};
});

jest.mock('../../assets/components/graphics/SoilMoistureChart', () => {
	const React = jest.requireActual('react');
	const { View } = jest.requireActual('react-native');
	return function SoilMoistureChartMock() {
		return <View testID='SoilMoistureChart' />;
	};
});

jest.mock('../../assets/components/graphics/ForecastVsIdfBarChart', () => {
	const React = jest.requireActual('react');
	const { View } = jest.requireActual('react-native');
	return function ForecastVsIdfBarChartMock() {
		return <View testID='ForecastVsIdfBarChart' />;
	};
});

const mockUseLocalSearchParams = jest.fn(() => ({}));

jest.mock('expo-router', () => {
	const React = jest.requireActual('react');

	return {
		useLocalSearchParams: () => mockUseLocalSearchParams(),

		useFocusEffect: (effect: () => void | (() => void)) => {
			React.useEffect(() => {
				const cleanup = effect?.();
				return cleanup;
			}, [effect]);
		},
	};
});

jest.mock('@/assets/utilities/getLatestSiteState');
jest.mock('@/assets/utilities/getSiteConfig');
jest.mock('@/assets/utilities/getSoilMoistureHistory');
jest.mock('@/assets/utilities/getSensorStatus');

const mockGetSensorStatus = getSensorStatus as unknown as jest.Mock;
const mockGetLatestSiteState = getLatestSiteState as jest.Mock;
const mockGetSiteConfig = getSiteConfig as unknown as jest.Mock;
const mockGetMoisture6hRows = getMoisture6hRows as unknown as jest.Mock;

describe('Insights screen', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseLocalSearchParams.mockReturnValue({});
		mockGetSensorStatus.mockReturnValue({ failed: false });
	});

	it('shows loading state initially', () => {
		mockGetLatestSiteState.mockReturnValue(new Promise(() => {}));
		mockGetMoisture6hRows.mockReturnValue(new Promise(() => {}));
		mockGetSiteConfig.mockReturnValue(new Promise(() => {}));

		const { getByText } = render(<Insights />);
		expect(getByText('loading')).toBeTruthy();
	});

	it('shows error state when load fails', async () => {
		mockGetLatestSiteState.mockRejectedValue(
			new Error('Failed to load insights data'),
		);
		mockGetMoisture6hRows.mockResolvedValue(makeMoistureRows([0.2]));
		mockGetSiteConfig.mockResolvedValue(makeSiteConfig());

		const { getByText } = render(<Insights />);

		await waitFor(() =>
			expect(getByText(/Failed to load insights data/i)).toBeTruthy(),
		);
	});

	it('shows error state when site state is missing (null)', async () => {
		mockGetLatestSiteState.mockResolvedValue(null);
		mockGetMoisture6hRows.mockResolvedValue(makeMoistureRows([0.2]));
		mockGetSiteConfig.mockResolvedValue(makeSiteConfig());

		const { getByText } = render(<Insights />);

		await waitFor(() => expect(getByText('error')).toBeTruthy());
	});

	it('shows sensor unavailable error when qc report indicates failed', async () => {
		mockGetSensorStatus.mockReturnValue({ failed: true });

		mockGetLatestSiteState.mockResolvedValue(
			makeSiteState({
				qc_report: {} as any,
			}),
		);
		mockGetMoisture6hRows.mockResolvedValue(makeMoistureRows([0.2]));
		mockGetSiteConfig.mockResolvedValue(makeSiteConfig());

		const { getByText } = render(<Insights />);
		await waitFor(() =>
			expect(getByText(/Sensor data is unavailable/i)).toBeTruthy(),
		);
	});

	it('renders the three insight sections after load', async () => {
		mockGetLatestSiteState.mockResolvedValue(
			makeSiteState({
				sat_front: 0.35,
				sat_back: 0.3,
				sat_left: 0.25,
				sat_right: 0.28,
				forecast_24h_total_mm: 18,
			}),
		);
		mockGetMoisture6hRows.mockResolvedValue(
			makeMoistureRows([0.2, 0.22, 0.25, 0.24, 0.23]),
		);
		mockGetSiteConfig.mockResolvedValue(makeSiteConfig({ idf_24h_2yr_mm: 50 }));

		const { getByText, getByTestId } = render(<Insights />);

		await waitFor(() => expect(getByText('Foundation moisture')).toBeTruthy());

		expect(getByText('Soil moisture trend')).toBeTruthy();
		expect(getByText('Rain intensity context')).toBeTruthy();

		expect(getByTestId('FoundationMoistureMap')).toBeTruthy();
		expect(getByTestId('SoilMoistureChart')).toBeTruthy();
		expect(getByTestId('ForecastVsIdfBarChart')).toBeTruthy();
	});

	it('computes and displays Avg moisture text', async () => {
		mockGetLatestSiteState.mockResolvedValue(
			makeSiteState({
				sat_front: 0.4,
				sat_back: 0.3,
				sat_left: 0.2,
				sat_right: 0.1,
			}),
		);
		mockGetMoisture6hRows.mockResolvedValue(makeMoistureRows([0.2]));
		mockGetSiteConfig.mockResolvedValue(makeSiteConfig({ idf_24h_2yr_mm: 50 }));

		const { getByText } = render(<Insights />);

		await waitFor(() => expect(getByText('Foundation moisture')).toBeTruthy());

		expect(getByText('Avg')).toBeTruthy();
		expect(getByText('25.0%')).toBeTruthy();
	});

	it('renders 6h change and Peak stats using moisture rows', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState());
		mockGetMoisture6hRows.mockResolvedValue(
			makeMoistureRows([0.2, 0.21, 0.22, 0.24, 0.26]),
		);
		mockGetSiteConfig.mockResolvedValue(makeSiteConfig({ idf_24h_2yr_mm: 50 }));

		const { getByText } = render(<Insights />);

		await waitFor(() => expect(getByText('Soil moisture trend')).toBeTruthy());

		expect(getByText('6h change')).toBeTruthy();
		expect(getByText('+6.0%')).toBeTruthy();

		expect(getByText('Peak')).toBeTruthy();
		expect(getByText('26.0%')).toBeTruthy();
	});

	it('falls back safely when moisture rows contain non-finite values', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState());
		mockGetMoisture6hRows.mockResolvedValue([
			{ timestamp_iso: new Date().toISOString(), max_sat: NaN },
			{ timestamp_iso: new Date().toISOString(), max_sat: 'nope' },
		]);
		mockGetSiteConfig.mockResolvedValue(makeSiteConfig());

		const { getByText } = render(<Insights />);

		await waitFor(() => expect(getByText('Soil moisture trend')).toBeTruthy());

		expect(getByText('6h change')).toBeTruthy();
		expect(getByText('+0.0%')).toBeTruthy();
		expect(getByText('Peak')).toBeTruthy();
		expect(getByText('0.0%')).toBeTruthy();
	});

	it('symmetry note: Low branch mentions top two wet sides', async () => {
		mockGetLatestSiteState.mockResolvedValue(
			makeSiteState({
				sat_front: 0.85,
				sat_back: 0.7,
				sat_left: 0.1,
				sat_right: 0.12,
			}),
		);
		mockGetMoisture6hRows.mockResolvedValue(makeMoistureRows([0.2]));
		mockGetSiteConfig.mockResolvedValue(makeSiteConfig());

		const { getByText } = render(<Insights />);

		await waitFor(() => expect(getByText('Foundation moisture')).toBeTruthy());

		expect(getByText(/varies strongly by side/i)).toBeTruthy();
		expect(getByText(/front/i)).toBeTruthy();
		expect(getByText(/back/i)).toBeTruthy();
	});

	it('symmetry note: Moderate branch mentions highest side', async () => {
		mockGetLatestSiteState.mockResolvedValue(
			makeSiteState({
				sat_front: 0.4,
				sat_back: 0.3,
				sat_left: 0.28,
				sat_right: 0.29,
			}),
		);
		mockGetMoisture6hRows.mockResolvedValue(makeMoistureRows([0.2]));
		mockGetSiteConfig.mockResolvedValue(makeSiteConfig());

		const { getByText } = render(<Insights />);

		await waitFor(() => expect(getByText('Foundation moisture')).toBeTruthy());

		expect(getByText(/moisture differs by side/i)).toBeTruthy();
		expect(getByText(/Front is highest/i)).toBeTruthy();
	});

	it('pull-to-refresh calls the three loaders again', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState());
		mockGetMoisture6hRows.mockResolvedValue(makeMoistureRows([0.2, 0.21]));
		mockGetSiteConfig.mockResolvedValue(makeSiteConfig());

		const { getByText, UNSAFE_getByType } = render(<Insights />);

		await waitFor(() => expect(getByText('Foundation moisture')).toBeTruthy());

		const rc = UNSAFE_getByType(RefreshControl);

		await act(async () => {
			await rc.props.onRefresh();
		});

		expect(mockGetLatestSiteState).toHaveBeenCalledTimes(2);
		expect(mockGetMoisture6hRows).toHaveBeenCalledTimes(2);
		expect(mockGetSiteConfig).toHaveBeenCalledTimes(2);
	});

	it('handles scrollTo param without crashing', async () => {
		mockUseLocalSearchParams.mockReturnValue({ scrollTo: 'trend' });

		mockGetLatestSiteState.mockResolvedValue(makeSiteState());
		mockGetMoisture6hRows.mockResolvedValue(makeMoistureRows([0.2, 0.21]));
		mockGetSiteConfig.mockResolvedValue(makeSiteConfig());

		const { getByText } = render(<Insights />);
		await waitFor(() => expect(getByText('Soil moisture trend')).toBeTruthy());
	});
});
