import colors from '@/config/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { signUpAws } from '../../assets/utilities/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [showPw, setShowPw] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [touched, setTouched] = useState({
		email: false,
		password: false,
		confirm: false,
	});

	const emailError = useMemo(() => {
		if (!touched.email) return '';
		if (!email.trim()) return 'Email is required.';
		if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email.';
		return '';
	}, [email, touched.email]);

	const passwordError = useMemo(() => {
		if (!touched.password) return '';
		if (!password) return 'Password is required.';
		if (password.length < 8) return 'Use at least 8 characters.';
		return '';
	}, [password, touched.password]);

	const confirmError = useMemo(() => {
		if (!touched.confirm) return '';
		if (!confirm) return 'Please confirm your password.';
		if (confirm !== password) return 'Passwords do not match.';
		return '';
	}, [confirm, password, touched.confirm]);

	const canSubmit =
		!submitting &&
		!!email.trim() &&
		EMAIL_RE.test(email.trim()) &&
		password.length >= 8 &&
		confirm === password &&
		!emailError &&
		!passwordError &&
		!confirmError;

	async function onSubmit() {
		setTouched({ email: true, password: true, confirm: true });
		if (!canSubmit) return;

		try {
			setSubmitting(true);

			const res = await signUpAws(email.trim(), password);

			if (!res.ok) {
				Alert.alert('Sign up failed', res.message ?? 'Unable to sign up.');
				return;
			}

			router.replace('/(auth)/login');
		} catch (e: any) {
			Alert.alert('Error', e?.message ?? 'Something went wrong.');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Pressable
			style={{ flex: 1 }}
			onPress={Keyboard.dismiss}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
				<View style={styles.page}>
					<LinearGradient
						colors={colors.gradient}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={StyleSheet.absoluteFill}
					/>

					<Text style={styles.brand}>HydroWatch</Text>

					<View style={styles.card}>
						<Text style={styles.title}>Create your account</Text>

						<View style={styles.field}>
							<Text style={styles.label}>Email</Text>
							<TextInput
								value={email}
								onChangeText={setEmail}
								onBlur={() => setTouched((t) => ({ ...t, email: true }))}
								autoCapitalize='none'
								autoCorrect={false}
								keyboardType='email-address'
								placeholder='you@example.com'
								placeholderTextColor={colors.gray100}
								style={[styles.input, emailError ? styles.inputError : null]}
								editable={!submitting}
								returnKeyType='next'
							/>
							{!!emailError && <Text style={styles.error}>{emailError}</Text>}
						</View>

						<View style={styles.field}>
							<Text style={styles.label}>Password</Text>

							<View
								style={[
									styles.pwRow,
									passwordError ? styles.inputError : null,
								]}>
								<TextInput
									value={password}
									onChangeText={setPassword}
									onBlur={() => setTouched((t) => ({ ...t, password: true }))}
									secureTextEntry={!showPw}
									placeholder='••••••••'
									placeholderTextColor={colors.gray100}
									style={styles.pwInput}
									editable={!submitting}
									returnKeyType='next'
								/>
								<Pressable
									onPress={() => setShowPw((v) => !v)}
									disabled={submitting}
									style={({ pressed }) => [
										styles.pwToggle,
										pressed && !submitting ? { opacity: 0.7 } : null,
									]}>
									<Text style={styles.pwToggleText}>
										{showPw ? 'Hide' : 'Show'}
									</Text>
								</Pressable>
							</View>

							{!!passwordError && (
								<Text style={styles.error}>{passwordError}</Text>
							)}
						</View>

						<View style={styles.field}>
							<Text style={styles.label}>Confirm password</Text>

							<View
								style={[styles.pwRow, confirmError ? styles.inputError : null]}>
								<TextInput
									value={confirm}
									onChangeText={setConfirm}
									onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
									secureTextEntry={!showConfirm}
									placeholder='••••••••'
									placeholderTextColor={colors.gray100}
									style={styles.pwInput}
									editable={!submitting}
									returnKeyType='done'
									onSubmitEditing={onSubmit}
								/>
								<Pressable
									onPress={() => setShowConfirm((v) => !v)}
									disabled={submitting}
									style={({ pressed }) => [
										styles.pwToggle,
										pressed && !submitting ? { opacity: 0.7 } : null,
									]}>
									<Text style={styles.pwToggleText}>
										{showConfirm ? 'Hide' : 'Show'}
									</Text>
								</Pressable>
							</View>

							{!!confirmError && (
								<Text style={styles.error}>{confirmError}</Text>
							)}
						</View>

						<Pressable
							onPress={onSubmit}
							disabled={!canSubmit}
							style={({ pressed }) => [
								styles.primaryBtn,
								!canSubmit ? styles.primaryBtnDisabled : null,
								pressed && canSubmit ? { opacity: 0.9 } : null,
							]}>
							{submitting ? (
								<ActivityIndicator />
							) : (
								<Text style={styles.primaryText}>Create account</Text>
							)}
						</Pressable>

						<View style={styles.actionsRow}>
							<Pressable
								onPress={() => router.back()}
								disabled={submitting}
								style={({ pressed }) => [
									styles.linkBtn,
									pressed && !submitting ? { opacity: 0.75 } : null,
								]}>
								<Text style={styles.linkText}>Back to sign in</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	page: {
		flex: 1,
		justifyContent: 'flex-start',
		paddingHorizontal: 16,
	},

	brand: {
		color: colors.black,
		fontSize: 40,
		fontWeight: '700',
		position: 'absolute',
		top: 100,
		alignSelf: 'center',
	},

	card: {
		borderRadius: 15,
		padding: 18,
		backgroundColor: colors.white,
		marginTop: 180,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 5,
	},

	title: {
		color: colors.black,
		fontSize: 20,
		fontWeight: '700',
		marginBottom: 12,
	},

	field: {
		marginBottom: 14,
	},

	label: {
		color: colors.black,
		marginBottom: 7,
		fontSize: 13,
		fontWeight: '600',
	},

	input: {
		height: 48,
		borderRadius: 15,
		paddingHorizontal: 12,
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.gray200,
		color: colors.black,
	},

	pwRow: {
		height: 48,
		borderRadius: 15,
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.gray200,
		flexDirection: 'row',
		alignItems: 'center',
		overflow: 'hidden',
	},

	pwInput: {
		flex: 1,
		height: '100%',
		paddingHorizontal: 12,
		color: colors.black,
	},

	pwToggle: {
		paddingHorizontal: 12,
		height: '100%',
		justifyContent: 'center',
	},

	pwToggleText: {
		color: colors.gray200,
		fontWeight: '700',
	},

	inputError: {
		borderColor: colors.red200,
	},

	error: {
		color: colors.red200,
		marginTop: 7,
		fontSize: 12,
	},

	primaryBtn: {
		height: 52,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.blue300,
		marginTop: 10,
	},

	primaryBtnDisabled: {
		backgroundColor: colors.gray100,
	},

	primaryText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '800',
	},

	actionsRow: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		marginTop: 12,
	},

	linkBtn: {
		paddingVertical: 8,
		paddingHorizontal: 2,
	},

	linkText: {
		color: colors.gray200,
		fontWeight: '700',
	},
});
