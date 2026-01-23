import getSiteConfig from '@/assets/utilities/getSiteConfig';
import { fetchAuthSession } from 'aws-amplify/auth';

describe('getSiteConfig', () => {
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

	function loadGetSiteConfig(): { default: () => Promise<any> } {
		let mod: any;

		jest.isolateModules(() => {
			mod = jest.requireActual('@/assets/utilities/getSiteConfig');
		});

		return mod;
	}

	it('returns config on 200', async () => {
		(fetchAuthSession as jest.Mock).mockResolvedValue({
			tokens: { idToken: { toString: () => 'TOKEN' } },
		});

		mockFetchJson(200, { idf_24h_2yr_mm: 50 });

		const { default: getSiteConfig } = loadGetSiteConfig();

		const out = await getSiteConfig();

		expect(out.idf_24h_2yr_mm).toBe(50);

		const url = String((global.fetch as jest.Mock).mock.calls[0][0]);
		expect(url).toContain('https://example.com');
		expect(url).toContain('/site-config');
	});

	it('returns null if not signed in', async () => {
		process.env.EXPO_PUBLIC_API_BASE = 'https://example.com';

		(fetchAuthSession as jest.Mock).mockResolvedValue({ tokens: {} });

		global.fetch = jest.fn();

		await expect(getSiteConfig()).resolves.toBeNull();
		expect(global.fetch).not.toHaveBeenCalled();
	});
});
