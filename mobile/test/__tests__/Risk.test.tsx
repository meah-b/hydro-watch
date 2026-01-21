import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

import Risk from '@/app/(tabs)/risk';
import { getLatestSiteState } from '@/assets/utilities/getLatestSiteState';
import { makeSiteState } from '../fixtures/siteState';

jest.mock('@/assets/utilities/getLatestSiteState');
const mockGetLatestSiteState = getLatestSiteState as jest.Mock;

describe('Risk screen', () => {
	beforeEach(() => jest.clearAllMocks());

	it('renders risk drivers', async () => {
		mockGetLatestSiteState.mockResolvedValue(
			makeSiteState({
				risk_score: 72,
				base_soil_risk: 0.7,
				site_sensitivity_factor: 0.6,
				storm_factor: 0.4,
			})
		);

		const { getByText } = render(<Risk />);

		await waitFor(() => expect(getByText(/FLOOD RISK/i)).toBeTruthy());
		expect(getByText(/Current risk drivers/i)).toBeTruthy();
	});
});
