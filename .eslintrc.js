/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
	root: true,
	extends: [
		'@remix-run/eslint-config',
		'@remix-run/eslint-config/node',
		'@remix-run/eslint-config/jest-testing-library',
		'prettier',
	],
	rules: {
		'testing-library/no-await-sync-events': [
			'error',
			{
				eventModules: ['fire-event'],
			},
		],
	},
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
