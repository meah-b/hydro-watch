import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? '';

export async function getLatestSiteState() {
	const session = await fetchAuthSession();
	const idToken = session.tokens?.idToken?.toString();

	const res = await fetch(`${API_BASE}/site-state`, {
		headers: { Authorization: `Bearer ${idToken}` },
	});

	if (res.status === 404) return null;
	if (!res.ok) throw new Error(await res.text());

	return await res.json();
}
