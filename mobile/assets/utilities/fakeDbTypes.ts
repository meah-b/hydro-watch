export function asNumber(v: string): number {
	const n = Number(v);
	return Number.isFinite(n) ? n : NaN;
}

export function asBoolean(v: string): boolean {
	return v.trim().toLowerCase() === 'true';
}

export function asJsonArrayNumber(v: string): number[] {
	try {
		const parsed = JSON.parse(v);
		return Array.isArray(parsed) ? parsed.map((x) => Number(x)) : [];
	} catch {
		return [];
	}
}
