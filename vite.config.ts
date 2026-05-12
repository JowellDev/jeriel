import { vitePlugin as remix } from '@remix-run/dev'
import { remixDevTools } from 'remix-development-tools'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vite'
import remixConfig from './remix.config'
import vitePWAConfig from './vite-pwa.config'
import { installGlobals } from '@remix-run/node'

installGlobals()

declare module '@remix-run/node' {
	interface Future {
		v3_singleFetch: true
	}
}

export default defineConfig(({ isSsrBuild }) => ({
	plugins: [
		tsconfigPaths(),
		remix(remixConfig),
		!isSsrBuild && VitePWA(vitePWAConfig),
	].filter(Boolean),
	ssr: {
		external: ['@node-rs/argon2'],
	},
	optimizeDeps: {
		exclude: ['@node-rs/argon2'],
	},
	server: {
		port: 3000,
	},
}))
