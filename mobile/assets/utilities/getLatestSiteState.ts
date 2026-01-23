import { SiteState } from '@/config/types';
import { fetchAuthSession } from 'aws-amplify/auth';

export async function getLatestSiteState() {
	const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
	if (!API_BASE) throw new Error('Missing EXPO_PUBLIC_API_BASE');

	const session = await fetchAuthSession();
	const idToken = session.tokens?.idToken?.toString();

	const res = await fetch(`${API_BASE}/site-state`, {
		headers: { Authorization: `Bearer ${idToken}` },
	});

	if (res.status === 404) return null;
	if (!res.ok) throw new Error(await res.text());

	const data = await res.json();

	if (data == null) {
		throw new Error('Empty site state response');
	}

	return data as SiteState;
}
