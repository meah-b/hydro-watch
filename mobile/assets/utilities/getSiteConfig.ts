import { fetchAuthSession } from 'aws-amplify/auth';
import { SiteConfig } from '../../config/types';

export default async function getSiteConfig(): Promise<SiteConfig | null> {
	const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
	if (!API_BASE) {
		throw new Error('Missing API base URL (EXPO_PUBLIC_API_BASE).');
	}

	const session = await fetchAuthSession();
	const idToken = session.tokens?.idToken?.toString();

	if (!idToken) return null;

	const res = await fetch(`${API_BASE}/site-config`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${idToken}`,
			Accept: 'application/json',
		},
	});

	if (res.status === 404) return null;

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(text || `Request failed: (${res.status})`);
	}

	const data = (await res.json()) as any;

	if (data == null) throw new Error('Empty site config response');

	return data as SiteConfig;
}
