import { Influence } from '@/config/types';

export default function classifySymmetryFromSides(sats: number[]): Influence {
	const minV = Math.min(...sats);
	const maxV = Math.max(...sats);
	const spread = maxV - minV;

	if (spread <= 0.08) return 'High';
	if (spread <= 0.2) return 'Moderate';
	return 'Low';
}
