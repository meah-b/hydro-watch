module.exports = {
	preset: 'jest-expo',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	transformIgnorePatterns: [
		'node_modules/(?!((jest-)?react-native|@react-native|react-native-svg|expo(nent)?|@expo(nent)?/.*|expo-modules-core|expo-router|@react-navigation/.*))',
	],
	testMatch: ['**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/$1',
	},
};
