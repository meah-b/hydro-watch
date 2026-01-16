import { SiteConfig } from '@/config/types';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? '';

export default async function saveSiteConfig(update: SiteConfig) {
	if (!API_BASE) {
		throw new Error('Missing EXPO_PUBLIC_API_BASE');
	}

	const session = await fetchAuthSession();
	const idToken = session.tokens?.idToken?.toString();
	if (!idToken) throw new Error('Not signed in');

	const res = await fetch(`${API_BASE}/site-config`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${idToken}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify(update),
	});

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(text || `Failed (${res.status})`);
	}

	return (await res.json()) as any;
}
