export const INFLUENCE_LEVELS = ['Low', 'Moderate', 'High'] as const;
export type Influence = (typeof INFLUENCE_LEVELS)[number];

export const RISK_LEVELS = ['Low', 'Moderate', 'High', 'Severe'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const SEVERITY_LEVELS = ['Normal', 'Elevated', 'High'] as const;
export type Severity = (typeof SEVERITY_LEVELS)[number];

export const SIDES = ['Front', 'Back', 'Right', 'Left'] as const;
export type Side = (typeof SIDES)[number];

export type DriverKey = 'soil' | 'sensitivity' | 'storm';

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

export type SiteConfig = {
	lat?: number;
	lon?: number;
	location_label?: string;
	soil_type?: string;
	fc_vwc?: number;
	sat_vwc?: number;
	idf_24h_2yr_mm?: number;
};

export type SiteState = {
	risk_score?: number;
	base_soil_risk?: number;
	site_sensitivity_factor?: number;
	storm_factor?: number;
	max_sat?: number;
	qc_report?: any;
	last_updated_iso?: string;
	timestamp_iso?: string;
	forecast_24h_total_mm?: number;
	forecast_24h_hourly_mm?: number[];
	idf_24h_2yr_mm?: number;
	sat_front?: number;
	sat_back?: number;
	sat_left?: number;
	sat_right?: number;
};

export type LoadingState = 'loading' | 'error';

export type SoilType =
	| 'sand'
	| 'loamy_sand'
	| 'sandy_loam'
	| 'loam'
	| 'silt_loam'
	| 'silt'
	| 'sandy_clay_loam'
	| 'clay_loam'
	| 'silty_clay_loam'
	| 'silty_clay'
	| 'sandy_clay'
	| 'clay';

export interface SoilProperties {
	fc: number;
	sat: number;
}

export type MoistureRow = {
	timestamp_iso: string;
	max_sat: number;
};

export type SectionKey = 'foundation' | 'trend' | 'rain';

export type SensorStatus = {
	value: string;
	desc: string;
	failed: boolean;
};
