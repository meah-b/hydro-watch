import {
	signOut as amplifySignOut,
	confirmSignIn,
	getCurrentUser,
	signIn,
} from 'aws-amplify/auth';
import * as SecureStore from 'expo-secure-store';

const KEY = 'session';

export async function signInAws(email: string, password: string) {
	try {
		const res = await signIn({
			username: email.trim(),
			password,
			options: { authFlowType: 'USER_PASSWORD_AUTH' },
		});

		if (res.isSignedIn) {
			await SecureStore.setItemAsync(KEY, 'ok');
			return { ok: true as const };
		}

		// If Cognito forces a password change on first login
		if (
			res.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
		) {
			return {
				ok: false as const,
				message: 'NEW_PASSWORD_REQUIRED',
			};
		}

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

export async function completeNewPassword(newPassword: string) {
	const res = await confirmSignIn({ challengeResponse: newPassword });

	if (res.isSignedIn) {
		await SecureStore.setItemAsync(KEY, 'ok');
		return { ok: true as const };
	}

	return {
		ok: false as const,
		message: `Still needs step: ${res.nextStep?.signInStep ?? 'UNKNOWN'}`,
	};
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
