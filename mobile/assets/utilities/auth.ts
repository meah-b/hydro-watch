import {
	signOut as amplifySignOut,
	confirmSignUp,
	getCurrentUser,
	resendSignUpCode,
	signIn,
	signUp,
} from 'aws-amplify/auth';
import * as SecureStore from 'expo-secure-store';

const KEY = 'session';

export async function signUpAws(email: string, password: string) {
	try {
		const username = email.trim().toLowerCase();

		const res = await signUp({
			username,
			password,
			options: {
				userAttributes: {
					email: username,
				},
			},
		});

		if (res.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
			return { ok: true as const, needsConfirm: true as const };
		}

		return { ok: true as const, needsConfirm: false as const };
	} catch (e: any) {
		return {
			ok: false as const,
			message: e?.message ?? e?.name ?? 'Sign up failed',
		};
	}
}

export async function confirmSignUpAws(email: string, code: string) {
	try {
		const username = email.trim().toLowerCase();

		await confirmSignUp({
			username,
			confirmationCode: code.trim(),
		});

		return { ok: true as const };
	} catch (e: any) {
		return {
			ok: false as const,
			message: e?.message ?? e?.name ?? 'Confirmation failed',
		};
	}
}

export async function resendSignUpCodeAws(email: string) {
	try {
		const username = email.trim().toLowerCase();

		await resendSignUpCode({ username });

		return { ok: true as const };
	} catch (e: any) {
		return {
			ok: false as const,
			message: e?.message ?? e?.name ?? 'Could not resend code',
		};
	}
}

export async function signInAws(email: string, password: string) {
	try {
		const username = email.trim().toLowerCase();

		const res = await signIn({
			username,
			password,
			options: { authFlowType: 'USER_PASSWORD_AUTH' },
		});

		if (res.isSignedIn) {
			await SecureStore.setItemAsync(KEY, 'ok');
			return { ok: true as const };
		}

		// If not signed in, Cognito usually supplies a next step
		return {
			ok: false as const,
			message: `Extra step required: ${res.nextStep?.signInStep ?? 'UNKNOWN'}`,
		};
	} catch (e: any) {
		return {
			ok: false as const,
			message: e?.message ?? e?.name ?? 'Sign in failed',
		};
	}
}

export async function signOut() {
	await amplifySignOut();
	await SecureStore.deleteItemAsync(KEY);
}

export async function isSignedIn() {
	const flag = await SecureStore.getItemAsync(KEY);
	if (flag !== 'ok') return false;

	try {
		await getCurrentUser();
		return true;
	} catch {
		await SecureStore.deleteItemAsync(KEY);
		return false;
	}
}
