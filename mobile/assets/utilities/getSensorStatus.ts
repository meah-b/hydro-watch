import { SensorStatus } from '@/config/types';

export default function getSensorStatus(qc: any): SensorStatus {
	if (qc && !qc.qc_failed) {
		if (qc.all_sensors_present && qc.all_sensors_normal) {
			return {
				value: '4/4 sensors active',
				desc: 'Sampling every 15 minutes',
				failed: false,
			};
		}
		const fallbackCount = qc.fallback_sensors.length;

		if (fallbackCount) {
			return {
				value: `${4 - fallbackCount}/4 sensors active · ${fallbackCount} using fallback`,
				desc: 'Monitor sensor reliability',
				failed: false,
			};
		}
	}

	return {
		value: 'Sensor data unavailable',
		desc: 'Risk estimates are temporarily unavailable, check sensor connections',
		failed: true,
	};
}
