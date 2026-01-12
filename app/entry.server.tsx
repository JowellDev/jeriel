/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/docs/en/main/file-conventions/entry.server
 */

import { PassThrough } from 'node:stream'

import {
	createReadableStreamFromReadable,
	type EntryContext,
} from '@remix-run/node'
import { RemixServer } from '@remix-run/react'
import { isbot } from 'isbot'
import { renderToPipeableStream } from 'react-dom/server'
import { initializeCronJobs } from '~/helpers/cron-scheduler'

const ABORT_DELAY = 5_000

let cronInitialized = false

async function initCronJobs() {
	if (cronInitialized) return
	cronInitialized = true

	try {
		await initializeCronJobs()
	} catch (error) {
		console.error('❌ Failed to initialize cron jobs:', error)
	}
}

// Initialize cron jobs when the module is loaded
initCronJobs().catch(console.error)

export default function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext,
) {
	return isbot(request.headers.get('user-agent') || '')
		? handleBotRequest(
				request,
				responseStatusCode,
				responseHeaders,
				remixContext,
			)
		: handleBrowserRequest(
				request,
				responseStatusCode,
				responseHeaders,
				remixContext,
			)
}

function handleBotRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext,
) {
	return new Promise((resolve, reject) => {
		const { pipe, abort } = renderToPipeableStream(
			<RemixServer
				context={remixContext}
				url={request.url}
				abortDelay={ABORT_DELAY}
			/>,
			{
				onAllReady() {
					const body = new PassThrough()

					responseHeaders.set('Content-Type', 'text/html')

					resolve(
						new Response(createReadableStreamFromReadable(body), {
							headers: responseHeaders,
							status: responseStatusCode,
						}),
					)

					pipe(body)
				},
				onShellError(error: unknown) {
					reject(error)
				},
				onError(error: unknown) {
					responseStatusCode = 500
					console.error(error)
				},
			},
		)

		setTimeout(abort, ABORT_DELAY)
	})
}

function handleBrowserRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext,
) {
	return new Promise((resolve, reject) => {
		let shellRendered = false
		const { pipe, abort } = renderToPipeableStream(
			<RemixServer
				context={remixContext}
				url={request.url}
				abortDelay={ABORT_DELAY}
			/>,
			{
				onShellReady() {
					shellRendered = true
					const body = new PassThrough()

					responseHeaders.set('Content-Type', 'text/html')

					resolve(
						new Response(createReadableStreamFromReadable(body), {
							headers: responseHeaders,
							status: responseStatusCode,
						}),
					)

					pipe(body)
				},
				onShellError(error: unknown) {
					reject(error)
				},
				onError(error: unknown) {
					if (shellRendered) {
						console.error(error)
					}

					responseStatusCode = 500
				},
			},
		)

		setTimeout(abort, ABORT_DELAY)
	})
}
