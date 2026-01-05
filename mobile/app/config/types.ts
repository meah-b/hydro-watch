export const INFLUENCE_LEVELS = ['Low', 'Moderate', 'High'] as const;
export type Influence = (typeof INFLUENCE_LEVELS)[number];

export const RISK_LEVELS = ['Low', 'Moderate', 'High', 'Severe'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const SEVERITY_LEVELS = ['Normal', 'Elevated', 'High'] as const;
export type Severity = (typeof SEVERITY_LEVELS)[number];

export const SIDES = ['Front', 'Back', 'Right', 'Left'] as const;
export type Side = (typeof SIDES)[number];

export type DriverKey =
	| 'soilMoisture'
	| 'siteSensitivity'
	| 'forecastedRainfall';

export type DriverItem = {
	key: DriverKey;
	title: string;
	value: Influence;
};

export interface SensorNode {
	side: Side;
	moisture: number;
	severity: Severity;
}

export interface SensorNodesMap {
	front: SensorNode;
	back: SensorNode;
	left: SensorNode;
	right: SensorNode;
}

export interface RainfallData {
	forecastedDepth24h: number;
	idfDepth24h: number;
}
