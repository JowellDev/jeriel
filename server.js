import http from 'node:http'
import path from 'node:path'
import { createRequestHandler } from '@remix-run/express'
import { installGlobals } from '@remix-run/node'
import compression from 'compression'
import express from 'express'
import morgan from 'morgan'
import sourceMapSupport from 'source-map-support'

sourceMapSupport.install()

installGlobals()

const viteDevServer =
	process.env.NODE_ENV === 'production'
		? undefined
		: await import('vite').then(vite =>
				vite.createServer({
					server: { middlewareMode: true },
				}),
			)

const remixHandler = createRequestHandler({
	build: viteDevServer
		? () => viteDevServer.ssrLoadModule('virtual:remix/server-build')
		: await import('./build/server/index.js'),
})

const app = express()

const server = http.createServer(app)

app.use(compression())

app.disable('x-powered-by')

if (viteDevServer) {
	app.use(viteDevServer.middlewares)
} else {
	app.use(
		'/assets',
		express.static('build/client/assets', {
			immutable: true,
			maxAge: '1y',
		}),
	)

	app.get('/sw.js', (_req, res) => {
		res.set('Cache-Control', 'public, max-age=0, must-revalidate')
		res.sendFile(path.resolve('build/client/sw.js'))
	})
}

app.use(express.static('build/client', { maxAge: '1h' }))

app.use(morgan('tiny'))

app.all('*', remixHandler)

const port = process.env.PORT || 3000

server.listen(port, '0.0.0.0', () => {
	console.log(`Express server listening at http://localhost:${port}`)
})
