import js from '@eslint/js';
import globals from 'globals';

export default [
	{
		ignores: [
			'node_modules/',
			'coverage/',
			'tmp/',
		]
	},
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 2023,
			sourceType: 'module',
			globals: {
				...globals.node,
				...globals.vitest
			}
		},
		rules: {
			...js.configs.recommended.rules,
			// Project-specific adjustments can go here
			'no-console': 'off'
		}
	}
];
