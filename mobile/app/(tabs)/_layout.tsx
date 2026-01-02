import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import AppHeader from '../assets/components/utilities/Header';
import colors from '../config/theme';

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				animation: 'shift',
				headerShown: true,
				header: () => (
					<AppHeader
						onPressNotifications={() => {}}
						onPressMenu={() => {}}
					/>
				),
				headerTransparent: true,
				headerShadowVisible: false,
				tabBarShowLabel: true,
				tabBarActiveTintColor: colors.black,
				tabBarInactiveTintColor: colors.black,
				tabBarStyle: {
					height: 80,
					paddingTop: 8,
					paddingBottom: 12,
					position: 'absolute',
					left: 10,
					right: 10,
					bottom: 0,
					backgroundColor: colors.white,
					borderTopWidth: 0,
					shadowColor: colors.black,
					shadowOffset: { width: 0, height: 8 },
					shadowOpacity: 0.2,
					shadowRadius: 12,
					elevation: 12,
				},
				tabBarLabelStyle: {
					fontSize: 12,
					fontFamily: 'jost',
					marginTop: 2,
				},
			}}>
			<Tabs.Screen
				name='home'
				options={{
					title: 'Home',
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons
							name={focused ? 'home' : 'home-outline'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='risk-levels'
				options={{
					title: 'Risk',
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons
							name={focused ? 'warning' : 'warning-outline'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='insights'
				options={{
					title: 'Insights',
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons
							name={focused ? 'bar-chart' : 'bar-chart-outline'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
