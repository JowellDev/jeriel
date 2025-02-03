const { flatRoutes } = require('remix-flat-routes')

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	future: {
		v3_fetcherPersist: true,
		v3_lazyRouteDiscovery: true,
		v3_relativeSplatPath: true,
		v3_singleFetch: true,
		v3_throwAbortReason: true
	},
	cacheDirectory: './node_modules/.cache/remix',
	ignoredRouteFiles: ['**/*'],
	routes: async defineRoutes => {
		return flatRoutes('routes', defineRoutes)
	},
	postcss: true,
	serverModuleFormat: 'cjs',
	tailwind: true,
}
