import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { isSignedIn } from '../assets/utilities/auth';

export default function Index() {
	const [ready, setReady] = useState(false);
	const [authed, setAuthed] = useState(false);

	useEffect(() => {
		isSignedIn().then((ok) => {
			setAuthed(ok);
			setReady(true);
		});
	}, []);

	if (!ready) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator />
			</View>
		);
	}

	return authed ? (
		<Redirect href='/(tabs)/home' />
	) : (
		<Redirect href='/(auth)/login' />
	);
}
