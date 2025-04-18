import type { VitePluginConfig } from '@remix-run/dev'
import { flatRoutes } from 'remix-flat-routes'

export default {
	ignoredRouteFiles: ['**/*.css'],
	future: {
		v3_fetcherPersist: true,
		v3_relativeSplatPath: true,
		v3_throwAbortReason: true,
		v3_singleFetch: true,
		v3_lazyRouteDiscovery: true,
	},
	routes: async defineRoutes => {
		return flatRoutes('routes', defineRoutes)
	},
} satisfies VitePluginConfig
