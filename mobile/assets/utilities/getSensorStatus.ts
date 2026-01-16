export default function getSensorStatus(qc: any): string {
	let sensorStatusValue: string;

	if (!qc) {
		sensorStatusValue = 'Sensor status unavailable.';
	} else if (qc.all_sensors_present && qc.all_sensors_normal) {
		sensorStatusValue = `${
			Object.keys(qc.valid_samples_kept).length
		}/4 sensors reporting normally.`;
	} else if (qc.all_sensors_present) {
		const parts = [];

		if (qc.fallback_sensors.length) {
			parts.push(`${qc.fallback_sensors.length} using fallback`);
		}
		if (Object.keys(qc.invalid_samples_removed).length > 0) {
			parts.push(
				`${Object.keys(qc.invalid_samples_removed).length} bad samples removed`
			);
		}

		sensorStatusValue =
			`4/4 sensors active, data adjusted` +
			(parts.length ? ` (${parts.join(', ')})` : '');
	} else {
		const missing = qc.missing_sensors.length;
		const failed = qc.failed_sensors.length;
		const working = 4 - missing - failed;

		if (missing || failed) {
			sensorStatusValue = `${working}/4 sensors available ( ${missing} missing, ${failed} failed )`;
		} else {
			sensorStatusValue = 'Sensor issue detected.';
		}
	}
	return sensorStatusValue;
}
