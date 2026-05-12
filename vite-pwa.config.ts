import { type VitePWAOptions } from 'vite-plugin-pwa'

export default {
	registerType: 'autoUpdate',
	injectRegister: null,
	includeAssets: ['images/favicon.png', 'images/icon-maskable.svg'],
	manifest: {
		name: 'Jériel',
		short_name: 'Jériel',
		description: "Système de gestion de l'église Vase d'honneur",
		theme_color: '#E9C724',
		background_color: '#226C67',
		display: 'standalone',
		scope: '/',
		start_url: '/dashboard',
		orientation: 'portrait',
		icons: [
			{
				src: 'images/favicon.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'any',
			},
			{
				src: 'images/favicon.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'any',
			},
			{
				src: 'images/icon-maskable.svg',
				sizes: 'any',
				type: 'image/svg+xml',
				purpose: 'maskable',
			},
		],
	},
	workbox: {
		globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2,ttf}'],
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
} as VitePWAOptions
