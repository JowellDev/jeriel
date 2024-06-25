import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();
import 'dotenv/config'

const PORT = process.env.PORT || '3000'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './tests/e2e',
	expect: {
		timeout: 10000,
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? 'blob' : 'html',
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'test env setup',
			testMatch: /test-env\.ts/,
		},
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			dependencies: ['test env setup'],
		},
	],
	webServer: {
		command: process.env.CI ? 'yarn test:e2e:prod' : `yarn dev`,
		reuseExistingServer: !process.env.CI,
		port: Number(PORT),
		stderr: 'pipe',
		stdout: 'pipe',
		timeout: 10 * 1000,
		env: {
			PORT,
		},
	},
})
