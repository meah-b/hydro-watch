export function mockFetchJson(
	status: number,
	body: any,
	headers: Record<string, string> = { 'content-type': 'application/json' },
) {
	(global.fetch as jest.Mock).mockResolvedValueOnce({
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
		text: async () => JSON.stringify(body),
		headers: { get: (k: string) => headers[k.toLowerCase()] },
	});
}

export function mockFetchText(status: number, text: string) {
	(global.fetch as jest.Mock).mockResolvedValueOnce({
		ok: status >= 200 && status < 300,
		status,
		json: async () => {
			throw new Error('not json');
		},
		text: async () => text,
		headers: { get: () => 'text/plain' },
	});
}
