import { vitePlugin as remix } from '@remix-run/dev'
import { flatRoutes } from 'remix-flat-routes'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vite'

declare module '@remix-run/node' {
	interface Future {
		v3_singleFetch: true
	}
}

export default defineConfig(({ isSsrBuild }) => ({
	plugins: [
		tsconfigPaths(),
		remix({
			future: {
				v3_fetcherPersist: true,
				v3_lazyRouteDiscovery: true,
				v3_relativeSplatPath: true,
				v3_singleFetch: true,
				v3_throwAbortReason: true,
			},
			ignoredRouteFiles: ['**/*'],
			routes: async defineRoutes => flatRoutes('routes', defineRoutes),
		}),
		!isSsrBuild &&
			VitePWA({
				registerType: 'autoUpdate',
				injectRegister: null,
				includeAssets: ['images/favicon.png'],
				manifest: {
					name: 'Jériel',
					short_name: 'Jériel',
					description: "Système de gestion de l'église Vase d'honneur",
					theme_color: '#E9C724',
					background_color: '#ffffff',
					display: 'standalone',
					scope: '/',
					start_url: '/',
					icons: [
						{
							src: 'images/favicon.png',
							sizes: '192x192',
							type: 'image/png',
						},
						{
							src: 'images/favicon.png',
							sizes: '512x512',
							type: 'image/png',
							purpose: 'any maskable',
						},
					],
				},
				workbox: {
					globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}'],
					globIgnores: ['**/auth-bg.png'],
					navigateFallback: null,
					runtimeCaching: [
						{
							urlPattern: /^\/api\/.*/i,
							handler: 'NetworkFirst',
							options: {
								cacheName: 'api-cache',
								expiration: {
									maxEntries: 50,
									maxAgeSeconds: 60 * 5,
								},
							},
						},
					],
				},
				devOptions: {
					enabled: true,
					type: 'module',
				},
			}),
	].filter(Boolean),
	ssr: {
		external: ['@node-rs/argon2'],
	},
	optimizeDeps: {
		exclude: ['@node-rs/argon2'],
	},
}))
