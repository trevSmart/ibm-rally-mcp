export default [
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globalThis,
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				global: 'readonly',
				module: 'readonly',
				require: 'readonly',
				exports: 'readonly'
			}
		},
		rules: {
			// Error prevention
			'no-console': 'off', // Permitir console.log para debugging
			'no-debugger': 'error',
			'no-alert': 'error',
			'no-duplicate-imports': 'error',
			'no-unused-vars': ['error', {
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_'
			}],

			// Code style
			'indent': ['error', 'tab'],
			'quotes': ['error', 'single'],
			'semi': ['error', 'always'],
			'comma-dangle': ['error', 'never'],
			'object-curly-spacing': ['error', 'always'],
			'array-bracket-spacing': ['error', 'never'],
			'comma-spacing': ['error', { 'before': false, 'after': true }],
			'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
			'space-before-blocks': 'error',
			'space-before-function-paren': ['error', 'never'],
			'space-in-parens': ['error', 'never'],
			'space-infix-ops': 'error',
			'keyword-spacing': 'error',

			// Best practices
			'eqeqeq': ['error', 'always'],
			'no-eval': 'error',
			'no-implied-eval': 'error',
			'no-new-func': 'error',
			'no-return-assign': 'error',
			'no-self-compare': 'error',
			'no-throw-literal': 'error',
			'no-unmodified-loop-condition': 'error',
			'no-unused-expressions': 'error',
			'no-useless-call': 'error',
			'no-useless-concat': 'error',
			'no-useless-return': 'error',
			'prefer-const': 'error',
			'prefer-arrow-callback': 'error',
			'arrow-spacing': 'error',
			'prefer-template': 'error',

			// ES6+ specific
			'prefer-destructuring': ['error', {
				'array': true,
				'object': true
			}, {
				'enforceForRenamedProperties': false
			}],
			'prefer-rest-params': 'error',
			'prefer-spread': 'error',
			'template-curly-spacing': 'error',

			// Node.js specific
			'no-process-exit': 'error',
			'no-path-concat': 'error'
		}
	}
];
