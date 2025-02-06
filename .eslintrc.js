/** @type {import('@types/eslint').Linter.Config} */
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
		"eslint:recommended"
	],
	overrides: [
		{
			files: ['tests/e2e/**'],
			rules: {
				'testing-library/prefer-screen-queries': 'off',
			},
		},

		// React
		{
			files: ["**/*.{js,jsx,ts,tsx}"],
			plugins: ["react", "jsx-a11y"],
			extends: [
				"plugin:react/recommended",
				"plugin:react/jsx-runtime",
				"plugin:react-hooks/recommended",
				"plugin:jsx-a11y/recommended",
			],
			settings: {
				react: {
					version: "detect",
				},
				formComponents: ["Form"],
				linkComponents: [
					{ name: "Link", linkAttribute: "to" },
					{ name: "NavLink", linkAttribute: "to" },
				],
				"import/resolver": {
					typescript: {},
				},
			},
		},

		// Typescript
		{
			files: ["**/*.{ts,tsx}"],
			plugins: ["@typescript-eslint", "import"],
			parser: "@typescript-eslint/parser",
			settings: {
				"import/internal-regex": "^~/",
				"import/resolver": {
					node: {
						extensions: [".ts", ".tsx"],
					},
					typescript: {
						alwaysTryTypes: true,
					},
				},
			},
			extends: [
				"plugin:@typescript-eslint/recommended",
				"plugin:import/recommended",
				"plugin:import/typescript",
			],
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
