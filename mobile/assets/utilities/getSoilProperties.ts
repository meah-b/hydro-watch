import { SoilProperties, SoilType } from '@/config/types';

const SOIL_TABLE: Record<SoilType, SoilProperties> = {
	sand: { fc: 0.1, sat: 0.46 },
	loamy_sand: { fc: 0.12, sat: 0.46 },
	sandy_loam: { fc: 0.18, sat: 0.45 },
	loam: { fc: 0.28, sat: 0.46 },
	silt_loam: { fc: 0.31, sat: 0.48 },
	silt: { fc: 0.3, sat: 0.48 },
	sandy_clay_loam: { fc: 0.27, sat: 0.43 },
	clay_loam: { fc: 0.36, sat: 0.48 },
	silty_clay_loam: { fc: 0.38, sat: 0.51 },
	silty_clay: { fc: 0.41, sat: 0.52 },
	sandy_clay: { fc: 0.36, sat: 0.44 },
	clay: { fc: 0.42, sat: 0.5 },
};

export function getSoilProperties(soil_type: string): SoilProperties {
	const key = soil_type.toLowerCase() as SoilType;

	const props = SOIL_TABLE[key];
	if (!props) {
		throw new Error(`Unknown soil type: ${soil_type}`);
	}

	return props;
}
