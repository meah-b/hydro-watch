import getIdfDepth from '@/assets/utilities/idfCurveExtraction';

let mockParsed: any = null;

jest.mock('fast-xml-parser', () => ({
	XMLParser: jest.fn().mockImplementation(() => ({
		parse: jest.fn(() => mockParsed),
	})),
}));

function mockFetchOk(xmlText = '<xml/>') {
	(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
		ok: true,
		status: 200,
		text: jest.fn().mockResolvedValue(xmlText),
	});
}

function mockFetchNotOk(status = 500, bodyText = 'server down') {
	(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
		ok: false,
		status,
		text: jest.fn().mockResolvedValue(bodyText),
	});
}

describe('idfCurveExtraction.getIdfDepth', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockParsed = null;
	});

	it('fetches the XML for the snapped grid lat and returns computed depth when exact coord exists', async () => {
		mockParsed = {
			root: {
				coord: [
					{
						'@_id': '43.004167,-81.004167',
						period: [{ '@_id': '2', '@_a': '10', '@_b': '0.2' }],
					},
				],
			},
		};

		mockFetchOk('<fake/>');

		const out = await getIdfDepth(43.0, -81.0);

		expect(out).toBeCloseTo(453.16, 2);

		expect(global.fetch).toHaveBeenCalledTimes(1);
		const url = String((global.fetch as jest.Mock).mock.calls[0][0]);
		expect(url).toContain('43.004167.xml');
	});

	it('falls back to closest longitude when exact coord id is not found (and warns)', async () => {
		const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

		mockParsed = {
			root: {
				coord: [
					{
						'@_id': '43.004167,-81.500000',
						period: [{ '@_id': '2', '@_a': '10', '@_b': '0.2' }],
					},
					{
						'@_id': '43.004167,-81.100000',
						period: [{ '@_id': '2', '@_a': '8', '@_b': '0.0' }],
					},
				],
			},
		};

		mockFetchOk('<fake/>');

		const out = await getIdfDepth(43.0, -81.0);
		expect(out).toBeCloseTo(192.0, 2);
		expect(warnSpy).toHaveBeenCalled();

		warnSpy.mockRestore();
	});

	it('throws when response is not ok', async () => {
		mockFetchNotOk(500, 'server down');
		mockParsed = { root: {} };

		await expect(getIdfDepth(43.0, -81.0)).rejects.toThrow(/Failed to fetch/i);
	});

	it('throws when no coord nodes are found in parsed XML', async () => {
		mockFetchOk('<fake/>');
		mockParsed = { root: { nope: true } };

		await expect(getIdfDepth(43.0, -81.0)).rejects.toThrow(/Parsed 0 coords/i);
	});

	it('throws when the requested period is missing in the chosen coord', async () => {
		mockFetchOk('<fake/>');
		mockParsed = {
			root: {
				coord: [
					{
						'@_id': '43.004167,-81.004167',
						period: [{ '@_id': '5', '@_a': '10', '@_b': '0.2' }],
					},
				],
			},
		};

		await expect(getIdfDepth(43.0, -81.0)).rejects.toThrow(/No 2-yr period/i);
	});

	it('throws when a/b are invalid numbers', async () => {
		mockFetchOk('<fake/>');
		mockParsed = {
			root: {
				coord: [
					{
						'@_id': '43.004167,-81.004167',
						period: [{ '@_id': '2', '@_a': 'nope', '@_b': '0.2' }],
					},
				],
			},
		};

		await expect(getIdfDepth(43.0, -81.0)).rejects.toThrow(/Invalid a\/b/i);
	});
});
