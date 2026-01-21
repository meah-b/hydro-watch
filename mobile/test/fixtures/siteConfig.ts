import type { SiteConfig } from '@/config/types';

export function makeSiteConfig(
	overrides: Partial<SiteConfig> = {}
): SiteConfig {
	return {
		lat: 43.6532,
		lon: -79.3832,
		idf_24h_2yr_mm: 45,
		...overrides,
	} as SiteConfig;
}
