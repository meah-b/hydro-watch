import { XMLParser } from 'fast-xml-parser';

const MTO_XML_BASE = 'https://idfcurves.mto.gov.on.ca/data_xml/';

function toGridCoordinate(coord: number): number {
	let negative = coord < 0;
	if (negative) coord = -coord;

	const d = Math.floor(coord);
	const minutesFloat = (coord - d) * 60;
	const m = Math.floor(minutesFloat);
	const secondsFloat = (minutesFloat - m) * 60;
	const s = Math.floor(secondsFloat);

	let snapped: number;
	if (s < 30) snapped = d + m / 60 + 1 / 240;
	else snapped = d + m / 60 + 1 / 80;

	if (negative) snapped = -snapped;
	return Number(snapped.toFixed(6));
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
	if (v == null) return [];
	return Array.isArray(v) ? v : [v];
}

function getAttr(node: any, name: string): string | undefined {
	return node?.[name] ?? node?.[`@_${name}`];
}

function collectNodesByKey(obj: any, keyName: string, out: any[] = []): any[] {
	if (obj == null) return out;

	if (Array.isArray(obj)) {
		for (const item of obj) collectNodesByKey(item, keyName, out);
		return out;
	}

	if (typeof obj === 'object') {
		for (const [k, v] of Object.entries(obj)) {
			if (k === keyName) {
				out.push(...asArray(v as any));
			} else {
				collectNodesByKey(v, keyName, out);
			}
		}
	}

	return out;
}

export default async function getIdfDepth(
	lat: number,
	lon: number,
	durationHours: number = 24,
	returnPeriod: number = 2
): Promise<number> {
	const gridLat = toGridCoordinate(lat);
	const gridLon = toGridCoordinate(lon);

	const xmlUrl = `${MTO_XML_BASE}${gridLat.toFixed(6)}.xml`;

	const resp = await fetch(xmlUrl);
	if (!resp.ok) throw new Error(`Failed to fetch ${xmlUrl}: ${resp.status}`);

	const xmlText = await resp.text();

	const parser = new XMLParser({
		ignoreAttributes: false,
	});

	const data = parser.parse(xmlText);

	const coords = collectNodesByKey(data, 'coord');

	if (coords.length === 0) {
		const topKeys = data && typeof data === 'object' ? Object.keys(data) : [];
		throw new Error(
			`Parsed 0 coords from ${xmlUrl}. Top-level keys: ${topKeys.join(', ')}`
		);
	}

	const coordIdExact = `${gridLat.toFixed(6)},${gridLon.toFixed(6)}`;
	let coord = coords.find((c: any) => getAttr(c, 'id') === coordIdExact);

	if (!coord) {
		let best: { node: any; delta: number } | null = null;

		for (const c of coords) {
			const id = getAttr(c, 'id');
			if (!id || typeof id !== 'string') continue;

			const parts = id.split(',');
			if (parts.length !== 2) continue;

			const lonCandidate = Number(parts[1]);
			if (!Number.isFinite(lonCandidate)) continue;

			const delta = Math.abs(lonCandidate - gridLon);
			if (!best || delta < best.delta) best = { node: c, delta };
		}

		if (!best) {
			throw new Error(
				`No coord found for ${coordIdExact} and no usable fallback in ${xmlUrl}`
			);
		}

		coord = best.node;
		console.warn(
			`Exact coord not found (${coordIdExact}). Using closest coord id=${getAttr(
				coord,
				'id'
			)} (Δlon=${best.delta}).`
		);
	}

	const periods = asArray((coord as any).period);
	if (periods.length === 0) {
		throw new Error(
			`Coord ${getAttr(coord, 'id')} has 0 periods (unexpected XML shape).`
		);
	}

	const period = periods.find(
		(p: any) => String(getAttr(p, 'id')) === String(returnPeriod)
	);
	if (!period) {
		throw new Error(
			`No ${returnPeriod}-yr period for coord ${getAttr(coord, 'id')}`
		);
	}

	const aStr = getAttr(period, 'a');
	const bStr = getAttr(period, 'b');
	if (!aStr || !bStr) {
		throw new Error(
			`Missing a/b attributes for coord ${getAttr(
				coord,
				'id'
			)} period ${returnPeriod}`
		);
	}

	const a = Number(aStr);
	const b = Number(bStr);
	if (!Number.isFinite(a) || !Number.isFinite(b)) {
		throw new Error(
			`Invalid a/b for coord ${getAttr(
				coord,
				'id'
			)} period ${returnPeriod}: a=${aStr}, b=${bStr}`
		);
	}

	const t = durationHours;
	const depthMm = a * Math.pow(t, b + 1);

	return Number(depthMm.toFixed(2));
}
