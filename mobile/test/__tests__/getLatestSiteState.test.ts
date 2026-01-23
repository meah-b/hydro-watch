describe('getLatestSiteState', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();

		process.env.EXPO_PUBLIC_API_BASE = 'https://example.com';

		global.fetch = jest.fn();
	});

	function mockFetchJson(status: number, body: any) {
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: status >= 200 && status < 300,
			status,
			json: async () => body,
			text: async () => JSON.stringify(body),
		});
	}

	function loadGetLatestSiteState(): {
		getLatestSiteState: (...args: any[]) => Promise<any>;
	} {
		let mod: any;

		jest.isolateModules(() => {
			mod = jest.requireActual('@/assets/utilities/getLatestSiteState');
		});

		return mod;
	}

	it('returns SiteState on 200', async () => {
		mockFetchJson(200, { risk_score: 70 });

		const { getLatestSiteState } = loadGetLatestSiteState();

		const out = await getLatestSiteState();

		expect(out.risk_score).toBe(70);
		expect(global.fetch).toHaveBeenCalledTimes(1);

		const url = String((global.fetch as jest.Mock).mock.calls[0][0]);
		expect(url).toContain('https://example.com');
		expect(url).toContain('/site-state');
	});

	it('throws when API returns null', async () => {
		mockFetchJson(200, null);

		const { getLatestSiteState } = loadGetLatestSiteState();

		await expect(getLatestSiteState()).rejects.toThrow(
			/empty site state response/i,
		);
	});

	it('throws when response is not ok', async () => {
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: false,
			status: 500,
			text: async () => 'server down',
			json: async () => ({}),
		});

		const { getLatestSiteState } = loadGetLatestSiteState();

		await expect(getLatestSiteState()).rejects.toThrow(/server down|500/i);
	});
});
