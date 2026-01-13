import { Stack } from 'expo-router';
import { configureAmplify } from '../src/amplifyClient';

configureAmplify();

export default function RootLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name='(auth)/login' />
			<Stack.Screen name='(tabs)' />
			<Stack.Screen
				name='(modals)/settings'
				options={{
					presentation: 'modal',
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name='(modals)/notifications'
				options={{
					presentation: 'modal',
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
