import colors from '@/config/theme';
import { LoadingState } from '@/config/types';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text } from 'react-native';

interface LoadingScreenProps {
	state: LoadingState;
	error: string | null;
}

export default function LoadingScreen(props: LoadingScreenProps) {
	return (
		<LinearGradient
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			colors={colors.gradient}
			style={{
				justifyContent: 'center',
				alignItems: 'center',
				flex: 1,
				paddingTop: 100,
				paddingHorizontal: 20,
			}}>
			<Text
				style={{
					color: colors.black,
					fontSize: 18,
					fontWeight: '700',
					textAlign: 'center',
				}}>
				{props.state === 'loading'
					? 'Loading site…'
					: (props.error ?? 'No data available')}
			</Text>
		</LinearGradient>
	);
}
