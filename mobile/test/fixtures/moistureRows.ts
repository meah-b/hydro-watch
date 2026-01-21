import type { MoistureRow } from '@/config/types';

export function makeMoistureRows(vals: number[]): MoistureRow[] {
	return vals.map((v, i) => ({
		timestamp_iso: new Date(2026, 0, 20, 12, i * 10).toISOString(),
		max_sat: v,
	}));
}
