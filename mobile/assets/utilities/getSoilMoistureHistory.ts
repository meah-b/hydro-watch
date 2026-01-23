import { MoistureRow } from '@/config/types';
import { fetchAuthSession } from 'aws-amplify/auth';

export default async function getMoisture6hRows(): Promise<MoistureRow[]> {
	const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
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

	if (!res.ok) throw new Error(await res.text());

	const data = await res.json();

	if (data == null) throw new Error('Empty moisture-6h response');

	return (data as MoistureRow[])
		.filter((r) => typeof r?.timestamp_iso === 'string')
		.sort((a, b) => a.timestamp_iso.localeCompare(b.timestamp_iso));
}
