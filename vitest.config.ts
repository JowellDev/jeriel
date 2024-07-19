/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['./test/setup-test-env.ts'],
		include: ['./app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		exclude: ['./tests/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		watchExclude: [
			'.*\\/node_modules\\/.*',
			'.*\\/build\\/.*',
			'.*\\/postgres-data\\/.*',
		],
		poolMatchGlobs: [
			['**/(loader|action).test.{js,mjs,cjs,ts,mts,cts}', 'forks'],
		],
		server: {
			deps: {
				inline: ['quirrel'],
			},
		},
		coverage: {
			provider: 'v8',
			reporter: [process.env.CI ? 'text-summary' : 'text-summary', 'html'],
			enabled: true,
			clean: true,
			include: ['app/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		},
	},
})
