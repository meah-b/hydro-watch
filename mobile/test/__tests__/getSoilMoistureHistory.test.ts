import { fetchAuthSession } from 'aws-amplify/auth';

describe('getSoilMoistureHistory (getMoisture6hRows)', () => {
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

	function loadGetMoisture6hRows(): { default: () => Promise<any[]> } {
		let mod: any;

		jest.isolateModules(() => {
			mod = jest.requireActual('@/assets/utilities/getSoilMoistureHistory');
		});

		return mod;
	}

	it('returns rows (happy path)', async () => {
		(fetchAuthSession as jest.Mock).mockResolvedValue({
			tokens: { idToken: { toString: () => 'TOKEN' } },
		});

		mockFetchJson(200, [
			{ timestamp_iso: '2026-01-20T12:00:00Z', max_sat: 0.1 },
			{ timestamp_iso: '2026-01-20T12:10:00Z', max_sat: 0.2 },
		]);

		const { default: getMoisture6hRows } = loadGetMoisture6hRows();

		const rows = await getMoisture6hRows();

		expect(Array.isArray(rows)).toBe(true);
		expect(rows).toHaveLength(2);

		const url = String((global.fetch as jest.Mock).mock.calls[0][0]);
		expect(url).toContain('https://example.com');
		expect(url).toContain('/moisture-6h');
	});

	it('handles empty array', async () => {
		(fetchAuthSession as jest.Mock).mockResolvedValue({
			tokens: { idToken: { toString: () => 'TOKEN' } },
		});

		mockFetchJson(200, []);

		const { default: getMoisture6hRows } = loadGetMoisture6hRows();

		const rows = await getMoisture6hRows();
		expect(rows).toEqual([]);
	});

	it('throws if response is not an array (after base URL is set)', async () => {
		(fetchAuthSession as jest.Mock).mockResolvedValue({
			tokens: { idToken: { toString: () => 'TOKEN' } },
		});

		mockFetchJson(200, { nope: true });

		const { default: getMoisture6hRows } = loadGetMoisture6hRows();

		await expect(getMoisture6hRows()).rejects.toThrow(
			/data.filter is not a function/i,
		);
	});
});
