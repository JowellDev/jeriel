import path from 'node:path'
import url from 'node:url'

import prom from '@isaacs/express-prometheus-middleware'
import { createRequestHandler } from '@remix-run/express'
import { installGlobals } from '@remix-run/node'
import compression from 'compression'
import type { RequestHandler } from 'express'
import express from 'express'
import morgan from 'morgan'
import sourceMapSupport from 'source-map-support'

sourceMapSupport.install()
installGlobals()
run()

async function run() {
	const isDev = process.env.NODE_ENV === 'development'

	const app = express()
	const metricsApp = express()
	app.use(
		prom({
			metricsPath: '/metrics',
			collectDefaultMetrics: true,
			metricsApp,
		}),
	)

	app.use((req, res, next) => {
		res.set('x-fly-region', process.env.FLY_REGION ?? 'unknown')
		res.set('Strict-Transport-Security', `max-age=${60 * 60 * 24 * 365 * 100}`)

		if (req.path.endsWith('/') && req.path.length > 1) {
			const query = req.url.slice(req.path.length)
			const safepath = req.path.slice(0, -1).replace(/\/+/g, '/')
			res.redirect(301, safepath + query)
			return
		}
		next()
	})

	app.all('*', function getReplayResponse(req, res, next) {
		const { method, path: pathname } = req
		const { PRIMARY_REGION, FLY_REGION } = process.env

		const isMethodReplayable = !['GET', 'OPTIONS', 'HEAD'].includes(method)
		const isReadOnlyRegion =
			FLY_REGION && PRIMARY_REGION && FLY_REGION !== PRIMARY_REGION

		if (!isMethodReplayable || !isReadOnlyRegion) return next()

		console.info(`Replaying:`, { pathname, method, PRIMARY_REGION, FLY_REGION })
		res.set('fly-replay', `region=${PRIMARY_REGION}`)
		return res.sendStatus(409)
	})

	app.use(compression())
	app.disable('x-powered-by')

	let remixHandler: RequestHandler

	if (isDev) {
		const vite = await import('vite')
		const viteDevServer = await vite.createServer({
			server: { middlewareMode: true },
		})
		app.use(viteDevServer.middlewares)

		remixHandler = async (req, res, next) => {
			try {
				const build = (await viteDevServer.ssrLoadModule(
					'virtual:remix/server-build',
				)) as Parameters<typeof createRequestHandler>[0]['build']
				return createRequestHandler({ build, mode: 'development' })(
					req,
					res,
					next,
				)
			} catch (err) {
				next(err)
			}
		}
	} else {
		// Serve fingerprinted assets with long-term cache
		app.use(
			'/assets',
			express.static('build/client/assets', { immutable: true, maxAge: '1y' }),
		)
		// Service worker must not be cached
		app.get('/sw.js', (_req, res) => {
			res.set('Cache-Control', 'public, max-age=0, must-revalidate')
			res.sendFile(path.resolve('build/client/sw.js'))
		})
		app.use(express.static('build/client', { maxAge: '1h' }))
		app.use(express.static('public', { maxAge: '1h' }))

		const BUILD_PATH = path.resolve('build/server/index.js')
		const build = await import(url.pathToFileURL(BUILD_PATH).href)
		remixHandler = createRequestHandler({ build, mode: 'production' })
	}

	app.use(morgan('tiny'))
	app.all('*', remixHandler)

	const port = process.env.PORT || 3000
	app.listen(port, () => {
		console.log(`✅ app ready: http://localhost:${port}`)
	})

	const metricsPort = process.env.METRICS_PORT || 3010
	metricsApp.listen(metricsPort, () => {
		console.log(`✅ metrics ready: http://localhost:${metricsPort}/metrics`)
	})
}
