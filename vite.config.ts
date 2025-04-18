import { vitePlugin as remix } from '@remix-run/dev'
import { defineConfig } from 'vite'
import { remixDevTools } from 'remix-development-tools'
import { envOnlyMacros } from 'vite-env-only'
import tsconfigPaths from 'vite-tsconfig-paths'
import remixConfig from './remix.config'
import rdtConfig from './rdt.config'

export default defineConfig({
	plugins: [
		remixDevTools(rdtConfig),
		remix(remixConfig),
		tsconfigPaths(),
		envOnlyMacros(),
	],
	optimizeDeps: {
		exclude: ['@node-rs/argon2'],
	},
	build: {
		rollupOptions: {
			external: ['@node-rs/argon2-wasm32-wasi'],
		},
		target: 'esnext',
	},
	server: {
		host: process.env.NODE_ENV === 'production' ? undefined : true,
	},
})
