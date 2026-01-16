import { fetchAuthSession } from 'aws-amplify/auth';
import { SiteConfig } from '../../config/types';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? '';

export default async function getSiteConfig(): Promise<SiteConfig | null> {
	if (!API_BASE) {
		throw new Error('Missing API base URL (EXPO_PUBLIC_API_BASE).');
	}

	const session = await fetchAuthSession();
	const idToken = session.tokens?.idToken?.toString();

	if (!idToken) {
		// Not signed in / no token available
		return null;
	}

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
		throw new Error(text || `Failed to load site config (${res.status})`);
	}

	const data = (await res.json()) as any;

	return {
		lat: typeof data.lat === 'number' ? data.lat : undefined,
		lon: typeof data.lon === 'number' ? data.lon : undefined,
		location_label:
			typeof data.location_label === 'string' ? data.location_label : undefined,
		soil_type: typeof data.soil_type === 'string' ? data.soil_type : undefined,
		fc_vwc: typeof data.fc_vwc === 'number' ? data.fc_vwc : undefined,
		sat_vwc: typeof data.sat_vwc === 'number' ? data.sat_vwc : undefined,
		idf_24h_2yr_mm:
			typeof data.idf_24h_2yr_mm === 'number' ? data.idf_24h_2yr_mm : undefined,
	};
}
