import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

import Insights from '@/app/(tabs)/insights';
import { getLatestSiteState } from '@/assets/utilities/getLatestSiteState';
import getSiteConfig from '@/assets/utilities/getSiteConfig';
import getMoisture6hRows from '@/assets/utilities/getSoilMoistureHistory';

import { makeMoistureRows } from '../fixtures/moistureRows';
import { makeSiteConfig } from '../fixtures/siteConfig';
import { makeSiteState } from '../fixtures/siteState';

jest.mock('@/assets/utilities/getLatestSiteState');
jest.mock('@/assets/utilities/getSiteConfig');
jest.mock('@/assets/utilities/getSoilMoistureHistory');

const mockGetLatestSiteState = getLatestSiteState as jest.Mock;
const mockGetSiteConfig = getSiteConfig as jest.Mock;
const mockGetMoisture6hRows = getMoisture6hRows as jest.Mock;

describe('Insights screen', () => {
	beforeEach(() => jest.clearAllMocks());

	it('renders the three insight sections', async () => {
		mockGetLatestSiteState.mockResolvedValue(makeSiteState());
		mockGetMoisture6hRows.mockResolvedValue(
			makeMoistureRows([0.2, 0.25, 0.22])
		);
		mockGetSiteConfig.mockResolvedValue(makeSiteConfig({ idf_24h_2yr_mm: 50 }));

		const { getByText } = render(<Insights />);

		await waitFor(() => expect(getByText(/Foundation moisture/i)).toBeTruthy());
		expect(getByText(/Soil moisture trend/i)).toBeTruthy();
		expect(getByText(/Rain intensity context/i)).toBeTruthy();
	});
});
