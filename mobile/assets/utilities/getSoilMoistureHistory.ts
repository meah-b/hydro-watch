import { MoistureRow } from '@/config/types';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? '';

export default async function getMoisture6hRows(): Promise<MoistureRow[]> {
	if (!API_BASE) throw new Error('Missing EXPO_PUBLIC_API_BASE');

	const session = await fetchAuthSession();
	const idToken = session.tokens?.idToken?.toString();
	if (!idToken) throw new Error('Not signed in');

	const res = await fetch(`${API_BASE}/moisture-6h`, {
		headers: {
			Authorization: `Bearer ${idToken}`,
			Accept: 'application/json',
		},
	});

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(text || `Failed to load moisture (${res.status})`);
	}

	const data = (await res.json()) as any[];

	return (data ?? [])
		.filter((r) => typeof r?.timestamp_iso === 'string')
		.sort((a, b) => a.timestamp_iso.localeCompare(b.timestamp_iso));
}
