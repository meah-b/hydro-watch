export default function getLastUpdatedText(iso: string): string {
	const t = Date.parse(iso);
	if (!Number.isFinite(t)) return 'Last updated: unknown';

	const diffMs = Date.now() - t;
	const diffMin = Math.max(0, Math.round(diffMs / (60 * 1000)));

	if (diffMin < 1) return 'Last updated: just now';
	if (diffMin === 1) return 'Last updated: 1 minute ago';
	if (diffMin < 60) return `Last updated: ${diffMin} minutes ago`;

	const diffHr = Math.floor(diffMin / 60);
	if (diffHr === 1) return 'Last updated: 1 hour ago';
	return `Last updated: ${diffHr} hours ago`;
}
