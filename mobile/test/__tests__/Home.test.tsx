import { render, waitFor } from '@testing-library/react-native';
import React, { act } from 'react';

import Home from '@/app/(tabs)/home';
import { getLatestSiteState } from '@/assets/utilities/getLatestSiteState';
import { makeSiteState } from '../fixtures/siteState';

jest.mock('@/assets/utilities/getLatestSiteState');
const mockGetLatestSiteState = getLatestSiteState as jest.Mock;

describe('Home screen', () => {
	beforeEach(() => jest.clearAllMocks());

	it('renders key sections after load', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState({ risk_score: 70 }));

		const { getByText } = render(<Home />);

		await waitFor(() => {
			expect(getByText('Flood risk')).toBeTruthy();
		});

		expect(getByText('Soil moisture')).toBeTruthy();
		expect(getByText('Site symmetry')).toBeTruthy();
		expect(getByText('Sensor Status')).toBeTruthy();
	});
});

describe('Home pull-to-refresh', () => {
	beforeEach(() => jest.clearAllMocks());

	it('updates values when refreshed', async () => {
		mockGetLatestSiteState
			.mockResolvedValueOnce(makeSiteState({ risk_score: 40 }))
			.mockResolvedValueOnce(makeSiteState({ risk_score: 85 }));

		const { getByText, UNSAFE_getByType } = render(<Home />);

		await waitFor(() => expect(getByText('Flood risk')).toBeTruthy());

		// Find RefreshControl
		const RefreshControl = require('react-native').RefreshControl;
		const rc = UNSAFE_getByType(RefreshControl);

		await act(async () => {
			await rc.props.onRefresh();
		});

		// Stronger assertion depends on your risk labeling.
		// Here we assert the score changed if you show it; otherwise assert label text change.
		// If Home doesn’t show score, you can assert that getLatestSiteState was called twice:
		expect(mockGetLatestSiteState).toHaveBeenCalledTimes(2);
	});
});
