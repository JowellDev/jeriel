import type { LoaderFunctionArgs } from '@remix-run/node'

import { prisma } from '~/utils/db.server'
import { getDomain } from '~/utils/url.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const host = getDomain(request)

	try {
		const url = new URL('/', host)
		// if we can connect to the database and make a simple query
		// and make a HEAD request to ourselves, then we're good.
		await Promise.all([
			prisma.user.count(),
			fetch(url.toString(), { method: 'HEAD' }).then(r => {
				if (!r.ok) return Promise.reject(r)
			}),
		])
		return new Response('OK')
	} catch (error: unknown) {
		console.log('healthcheck ❌', { error })
		return new Response('ERROR', { status: 500 })
	}
}
