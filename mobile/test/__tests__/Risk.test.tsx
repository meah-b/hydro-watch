import { render, waitFor } from '@testing-library/react-native';
import React, { act } from 'react';
import { RefreshControl } from 'react-native';

import Risk from '@/app/(tabs)/risk';
import { getLatestSiteState } from '@/assets/utilities/getLatestSiteState';
import getSensorStatus from '@/assets/utilities/getSensorStatus';
import { makeSiteState } from '../fixtures/siteState';

jest.mock('../../assets/utilities/riskDerivations', () => {
	const actual = jest.requireActual('../../assets/utilities/riskDerivations');
	return {
		...actual,
		buildRiskDrivers: jest.fn(() => [
			{ key: 'base_soil_risk', title: 'Base soil', value: 'High' },
			{
				key: 'site_sensitivity_factor',
				title: 'Site sensitivity',
				value: 'Moderate',
			},
			{ key: 'storm_factor', title: 'Storm', value: 'Low' },
		]),
	};
});

jest.mock('@/assets/utilities/buildDescriptions', () => ({
	buildRiskDesc: jest.fn(() => 'RISK_DESC_STUB'),
	buildInfluenceDesc: jest.fn(() => 'INFLUENCE_DESC_STUB'),
}));

jest.mock('@/assets/utilities/getLatestSiteState');
const mockGetLatestSiteState = getLatestSiteState as jest.Mock;

jest.mock('@/assets/utilities/getSensorStatus');
const mockGetSensorStatus = getSensorStatus as unknown as jest.Mock;

describe('Risk screen', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		mockGetSensorStatus.mockReturnValue({
			failed: false,
		});
	});

	it('shows loading state initially', () => {
		mockGetLatestSiteState.mockReturnValue(new Promise(() => {}));

		const { getByText } = render(<Risk />);
		expect(getByText(/Loading site/i)).toBeTruthy();
	});

	it('renders hero + drivers section after load', async () => {
		mockGetLatestSiteState.mockResolvedValue(
			makeSiteState({
				risk_score: 72,
				base_soil_risk: 0.7,
				site_sensitivity_factor: 0.6,
				storm_factor: 0.4,
			}),
		);

		const { getByText, getByTestId, getAllByText } = render(<Risk />);

		await waitFor(() => expect(getByText(/FLOOD RISK/i)).toBeTruthy());

		expect(getByTestId('RiskGauge')).toBeTruthy();
		expect(getByText(/Risk score:\s*72\s*\/\s*100/i)).toBeTruthy();

		expect(getByText('RISK_DESC_STUB')).toBeTruthy();

		expect(getByText('Current risk drivers')).toBeTruthy();
		expect(
			getByText(/Influence ratings describe how strongly each factor/i),
		).toBeTruthy();

		expect(getByText('Base soil')).toBeTruthy();
		expect(getByText('Site sensitivity')).toBeTruthy();
		expect(getByText('Storm')).toBeTruthy();

		const descs = getAllByText('INFLUENCE_DESC_STUB');
		expect(descs.length).toBeGreaterThanOrEqual(3);

		const pills = getAllByText(/influence/i);
		expect(pills.length).toBeGreaterThanOrEqual(3);
	});

	it('rounds risk_score to a whole number for display', async () => {
		mockGetLatestSiteState.mockResolvedValue(
			makeSiteState({ risk_score: 72.6 }),
		);

		const { getByText } = render(<Risk />);

		await waitFor(() => expect(getByText(/FLOOD RISK/i)).toBeTruthy());
		expect(getByText(/Risk score:\s*73\s*\/\s*100/i)).toBeTruthy();
	});

	it('shows LOW when risk_score is low', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState({ risk_score: 10 }));

		const { getByText } = render(<Risk />);

		await waitFor(() => expect(getByText(/LOW FLOOD RISK/i)).toBeTruthy());
		expect(getByText(/Risk score:\s*10\s*\/\s*100/i)).toBeTruthy();
	});

	it('shows MODERATE when risk_score is moderate', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState({ risk_score: 45 }));

		const { getByText } = render(<Risk />);

		await waitFor(() => expect(getByText(/MODERATE FLOOD RISK/i)).toBeTruthy());
		expect(getByText(/Risk score:\s*45\s*\/\s*100/i)).toBeTruthy();
	});

	it('shows HIGH when risk_score is high', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState({ risk_score: 70 }));

		const { getByText } = render(<Risk />);

		await waitFor(() => expect(getByText(/HIGH FLOOD RISK/i)).toBeTruthy());
		expect(getByText(/Risk score:\s*70\s*\/\s*100/i)).toBeTruthy();
	});

	it('shows SEVERE when risk_score is severe', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState({ risk_score: 95 }));

		const { getByText } = render(<Risk />);

		await waitFor(() => expect(getByText(/SEVERE FLOOD RISK/i)).toBeTruthy());
		expect(getByText(/Risk score:\s*95\s*\/\s*100/i)).toBeTruthy();
	});

	it('calls getLatestSiteState again when pull-to-refresh is triggered', async () => {
		mockGetLatestSiteState
			.mockResolvedValueOnce(makeSiteState({ risk_score: 40 }))
			.mockResolvedValueOnce(makeSiteState({ risk_score: 85 }));

		const { getByText, UNSAFE_getByType } = render(<Risk />);

		await waitFor(() => expect(getByText(/FLOOD RISK/i)).toBeTruthy());

		const rc = UNSAFE_getByType(RefreshControl);

		await act(async () => {
			await rc.props.onRefresh();
		});

		expect(mockGetLatestSiteState).toHaveBeenCalledTimes(2);
	});

	it('shows error state when load fails', async () => {
		mockGetLatestSiteState.mockRejectedValue(new Error('boom'));

		const { getByText } = render(<Risk />);

		await waitFor(() => expect(getByText('boom')).toBeTruthy());
	});

	it('shows error state when site state is missing (null)', async () => {
		mockGetLatestSiteState.mockResolvedValue(null);

		const { getByText } = render(<Risk />);

		await waitFor(() => expect(getByText(/no data available/i)).toBeTruthy());
	});
});
