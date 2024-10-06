/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
	root: true,
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
	env: {
		browser: true,
		commonjs: true,
		es6: true,
	},
	extends: [
		'@remix-run/eslint-config',
		'@remix-run/eslint-config/node',
		'@remix-run/eslint-config/jest-testing-library',
		'prettier',
	],
	overrides: [
		{
			files: ['tests/e2e/**'],
			rules: {
				'testing-library/prefer-screen-queries': 'off',
			},
		},
	],
	// We're using vitest which has a very similar API to jest
	// (so the linting plugins work nicely), but we have to
	// set the jest version explicitly.
	settings: {
		jest: {
			version: 28,
		},
	},
}
