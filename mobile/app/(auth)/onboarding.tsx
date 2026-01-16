import { getSoilProperties } from '@/assets/utilities/getSoilProperties';
import getIdfDepth from '@/assets/utilities/idfCurveExtraction';
import colors from '@/config/theme';
import { SoilType } from '@/config/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import saveSiteConfig from '../../assets/utilities/saveSiteConfig';

const SOIL_OPTIONS: { value: SoilType; label: string }[] = [
	{ value: 'sand', label: 'Sand' },
	{ value: 'loamy_sand', label: 'Loamy sand' },
	{ value: 'sandy_loam', label: 'Sandy loam' },
	{ value: 'loam', label: 'Loam' },
	{ value: 'silt_loam', label: 'Silt loam' },
	{ value: 'silt', label: 'Silt' },
	{ value: 'sandy_clay_loam', label: 'Sandy clay loam' },
	{ value: 'clay_loam', label: 'Clay loam' },
	{ value: 'silty_clay_loam', label: 'Silty clay loam' },
	{ value: 'silty_clay', label: 'Silty clay' },
	{ value: 'sandy_clay', label: 'Sandy clay' },
	{ value: 'clay', label: 'Clay' },
];

type Picked = { lat: number; lon: number };

function buildLabel(parts: Location.LocationGeocodedAddress): string {
	const city =
		parts.city || parts.subregion || parts.district || parts.region || '';
	const region = parts.region || '';
	const country = parts.country || '';

	const best =
		(city && region && `${city}, ${region}`) ||
		(city && country && `${city}, ${country}`) ||
		(region && country && `${region}, ${country}`) ||
		city ||
		region ||
		country ||
		'Dropped pin';

	return best;
}

export default function Onboarding() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [soilType, setSoilType] = useState<SoilType>('loam');
	const [soilOpen, setSoilOpen] = useState(false);

	const soilLabel = useMemo(() => {
		return (
			SOIL_OPTIONS.find((o) => o.value === soilType)?.label ?? 'Select soil'
		);
	}, [soilType]);

	const [region, setRegion] = useState<Region>({
		latitude: 42.9849,
		longitude: -81.2453,
		latitudeDelta: 0.05,
		longitudeDelta: 0.05,
	});

	const [picked, setPicked] = useState<Picked | null>(null);
	const [label, setLabel] = useState<string>('');

	useEffect(() => {
		(async () => {
			try {
				const { status } = await Location.requestForegroundPermissionsAsync();
				const ok = status === 'granted';

				if (ok) {
					const pos = await Location.getCurrentPositionAsync({
						accuracy: Location.Accuracy.Balanced,
					});

					setRegion((r) => ({
						...r,
						latitude: pos.coords.latitude,
						longitude: pos.coords.longitude,
					}));

					const initial = {
						lat: pos.coords.latitude,
						lon: pos.coords.longitude,
					};
					setPicked(initial);
					await updateLabel(initial.lat, initial.lon);
				}
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const canSave = useMemo(() => {
		return !!picked && !!label && !!soilType && !saving && !loading;
	}, [picked, label, soilType, saving, loading]);

	async function updateLabel(lat: number, lon: number) {
		try {
			const results = await Location.reverseGeocodeAsync({
				latitude: lat,
				longitude: lon,
			});

			if (results?.length) {
				setLabel(buildLabel(results[0]));
			} else {
				setLabel('Dropped pin');
			}
		} catch {
			setLabel('Dropped pin');
		}
	}

	async function onPick(lat: number, lon: number) {
		const next = { lat, lon };
		setPicked(next);
		await updateLabel(lat, lon);
	}

	async function onSave() {
		if (!picked) return;

		const { fc, sat } = getSoilProperties(soilType);
		const idf_24h_2yr_mm = await getIdfDepth(picked.lat, picked.lon);

		try {
			setSaving(true);

			await saveSiteConfig({
				lat: picked.lat,
				lon: picked.lon,
				location_label: label || 'Dropped pin',
				soil_type: soilType,
				fc_vwc: fc,
				sat_vwc: sat,
				idf_24h_2yr_mm: idf_24h_2yr_mm,
			});

			router.replace('/(tabs)/home');
		} catch (e: any) {
			Alert.alert('Could not save config', e?.message ?? 'Try again.');
		} finally {
			setSaving(false);
		}
	}

	return (
		<View style={styles.page}>
			<LinearGradient
				colors={colors.gradient}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={StyleSheet.absoluteFill}
			/>
			<View style={styles.card}>
				<Text style={styles.title}>Choose your site location</Text>
				<Text style={styles.subtitle}>
					Tap the map to place a pin where the sensor site is located.
				</Text>

				<View style={styles.mapWrap}>
					{loading ? (
						<View style={styles.mapLoading}>
							<ActivityIndicator />
							<Text style={styles.mapLoadingText}>Loading map…</Text>
						</View>
					) : (
						<MapView
							style={styles.map}
							initialRegion={region}
							onPress={(e) => {
								const { latitude, longitude } = e.nativeEvent.coordinate;
								onPick(latitude, longitude);
							}}
							onRegionChangeComplete={(r) => setRegion(r)}>
							{!!picked && (
								<Marker
									coordinate={{ latitude: picked.lat, longitude: picked.lon }}
									title={label || 'Selected location'}
								/>
							)}
						</MapView>
					)}
				</View>

				<View style={styles.previewRow}>
					<View style={{ flex: 1 }}>
						<Text style={styles.previewLabel}>Selected</Text>
						<Text
							style={styles.previewValue}
							numberOfLines={1}>
							{label || 'Tap the map to select a location'}
						</Text>
						{!!picked && (
							<Text style={styles.previewCoords}>
								{picked.lat.toFixed(5)}, {picked.lon.toFixed(5)}
							</Text>
						)}
					</View>
				</View>

				<View style={styles.soilBlock}>
					<Text style={styles.previewLabel}>Soil type</Text>
					<Pressable
						onPress={() => setSoilOpen(true)}
						disabled={saving || loading}
						style={({ pressed }) => [
							styles.soilSelect,
							saving || loading ? styles.soilSelectDisabled : null,
							pressed && !(saving || loading) ? { opacity: 0.92 } : null,
						]}>
						<Text style={styles.soilSelectText}>{soilLabel}</Text>
						<Ionicons
							name='chevron-down'
							size={18}
							color={colors.gray200}
						/>
					</Pressable>
				</View>

				<Modal
					visible={soilOpen}
					transparent
					animationType='fade'
					onRequestClose={() => setSoilOpen(false)}>
					<Pressable
						style={styles.modalBackdrop}
						onPress={() => setSoilOpen(false)}>
						<View style={styles.modalCard}>
							<Text style={styles.modalTitle}>Select soil type</Text>

							<ScrollView style={{ maxHeight: 360 }}>
								{SOIL_OPTIONS.map((opt) => {
									const active = opt.value === soilType;
									return (
										<Pressable
											key={opt.value}
											onPress={() => {
												setSoilType(opt.value);
												setSoilOpen(false);
											}}
											style={({ pressed }) => [
												styles.modalRow,
												active ? styles.modalRowActive : null,
												pressed ? { opacity: 0.85 } : null,
											]}>
											<Text
												style={[
													styles.modalRowText,
													active ? styles.modalRowTextActive : null,
												]}>
												{opt.label}
											</Text>
										</Pressable>
									);
								})}
							</ScrollView>

							<Pressable
								onPress={() => setSoilOpen(false)}
								style={styles.modalClose}>
								<Text style={styles.modalCloseText}>Cancel</Text>
							</Pressable>
						</View>
					</Pressable>
				</Modal>
				<Text style={styles.soilHint}>
					This helps calibrate field capacity and saturation for your site.
				</Text>

				<Pressable
					onPress={onSave}
					disabled={!canSave}
					style={({ pressed }) => [
						styles.primaryBtn,
						!canSave ? styles.primaryBtnDisabled : null,
						pressed && canSave ? { opacity: 0.92 } : null,
					]}>
					{saving ? (
						<ActivityIndicator />
					) : (
						<Text style={styles.primaryText}>Save</Text>
					)}
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	page: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 90,
	},

	card: {
		borderRadius: 15,
		padding: 16,
		backgroundColor: colors.white,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 5,
	},

	title: {
		color: colors.black,
		fontSize: 18,
		fontWeight: '800',
		marginBottom: 6,
	},

	subtitle: {
		color: colors.gray200,
		fontSize: 13,
		fontWeight: '600',
		marginBottom: 12,
	},

	mapWrap: {
		borderRadius: 15,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: colors.gray200,
		height: 320,
		backgroundColor: colors.white,
	},

	map: {
		flex: 1,
	},

	mapLoading: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
	},

	mapLoadingText: {
		color: colors.gray200,
		fontWeight: '700',
	},

	previewRow: {
		marginTop: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},

	previewLabel: {
		color: colors.black,
		fontSize: 12,
		fontWeight: '700',
		marginBottom: 2,
	},

	previewValue: {
		color: colors.black,
		fontSize: 14,
		fontWeight: '800',
	},

	previewCoords: {
		marginTop: 2,
		color: colors.gray200,
		fontSize: 12,
		fontWeight: '700',
	},

	badge: {
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: 999,
		backgroundColor: colors.gray100,
	},

	badgeText: {
		color: colors.black,
		fontSize: 11,
		fontWeight: '800',
	},

	primaryBtn: {
		height: 52,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.blue300,
		marginTop: 14,
	},

	primaryBtnDisabled: {
		backgroundColor: colors.gray100,
	},

	primaryText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '800',
	},

	hint: {
		marginTop: 10,
		color: colors.gray200,
		fontSize: 12,
		fontWeight: '600',
	},

	soilBlock: {
		marginTop: 12,
	},

	soilSelect: {
		marginTop: 6,
		height: 48,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: colors.gray200,
		backgroundColor: colors.white,
		paddingHorizontal: 12,
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row',
	},

	soilSelectDisabled: {
		backgroundColor: colors.gray100,
	},

	soilSelectText: {
		color: colors.black,
		fontSize: 14,
		fontWeight: '800',
	},

	soilHint: {
		marginTop: 6,
		color: colors.gray200,
		fontSize: 12,
		fontWeight: '600',
	},

	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.35)',
		justifyContent: 'center',
		padding: 18,
	},

	modalCard: {
		backgroundColor: colors.white,
		borderRadius: 18,
		padding: 14,
	},

	modalTitle: {
		color: colors.black,
		fontSize: 16,
		fontWeight: '900',
		marginBottom: 10,
	},

	modalRow: {
		paddingVertical: 12,
		paddingHorizontal: 10,
		borderRadius: 12,
	},

	modalRowActive: {
		backgroundColor: colors.gray100,
	},

	modalRowText: {
		color: colors.black,
		fontSize: 14,
		fontWeight: '700',
	},

	modalRowTextActive: {
		fontWeight: '900',
	},

	modalClose: {
		marginTop: 10,
		height: 44,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.gray100,
	},

	modalCloseText: {
		color: colors.black,
		fontSize: 14,
		fontWeight: '900',
	},
});
