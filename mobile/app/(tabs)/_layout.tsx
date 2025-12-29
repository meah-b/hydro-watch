import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import colors from '../config/theme';

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				animation: 'fade',
				headerShown: false,
				tabBarShowLabel: true,
				tabBarActiveTintColor: colors.white,
				tabBarInactiveTintColor: colors.blue100,
				tabBarStyle: {
					height: 72,
					paddingTop: 8,
					paddingBottom: 12,
					borderTopLeftRadius: 18,
					borderTopRightRadius: 18,
					position: 'absolute',
					left: 10,
					right: 10,
					bottom: 0,
					backgroundColor: colors.blue300,
					borderTopWidth: 0,
					shadowColor: colors.black,
					shadowOffset: { width: 0, height: 8 },
					shadowOpacity: 0.12,
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
				name='soil'
				options={{
					title: 'Soil',
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons
							name={focused ? 'leaf' : 'leaf-outline'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='site'
				options={{
					title: 'Site',
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons
							name={focused ? 'location' : 'location-outline'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='forecast'
				options={{
					title: 'Forecast',
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons
							name={focused ? 'rainy' : 'rainy-outline'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
