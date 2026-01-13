import { MOISTURE_6H_CSV, SITES_CSV } from '@/config/fakeDbCsv';

export type FakeDbRow = Record<string, string>;

function splitCsvLine(line: string): string[] {
	const out: string[] = [];
	let cur = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const ch = line[i];

		if (ch === '"') {
			const next = line[i + 1];
			if (inQuotes && next === '"') {
				cur += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}

		if (ch === ',' && !inQuotes) {
			out.push(cur);
			cur = '';
			continue;
		}

		cur += ch;
	}

	out.push(cur);
	return out.map((s) => s.trim());
}

export function parseCsvTable(csv: string): FakeDbRow[] {
	const lines = csv
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l.length > 0);

	if (lines.length < 2) return [];

	const headers = splitCsvLine(lines[0]);
	const rows: FakeDbRow[] = [];

	for (let i = 1; i < lines.length; i++) {
		const cols = splitCsvLine(lines[i]);
		const row: FakeDbRow = {};

		for (let j = 0; j < headers.length; j++) {
			row[headers[j]] = cols[j] ?? '';
		}

		rows.push(row);
	}

	return rows;
}

export const SITES_TABLE = parseCsvTable(SITES_CSV);

export function getSiteRow(siteId: string): FakeDbRow {
	const row = SITES_TABLE.find((r) => r.site_id === siteId);
	if (!row) {
		throw new Error(`Site not found in fake DB: ${siteId}`);
	}
	return row;
}

export const MOISTURE_6H_TABLE = parseCsvTable(MOISTURE_6H_CSV);

export function getMoisture6hRows(siteId: string): FakeDbRow[] {
	return MOISTURE_6H_TABLE.filter((r) => r.site_id === siteId).sort((a, b) =>
		a.timestamp_iso.localeCompare(b.timestamp_iso)
	);
}
