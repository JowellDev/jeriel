import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { z } from 'zod'

export function getDomain(request: Request) {
	const host =
		request.headers.get('X-Forwarded-Host') ?? request.headers.get('host')
	if (!host) {
		throw new Error('Could not determine domain URL.')
	}
	const protocol = host.includes('localhost') ? 'http' : 'https'
	return `${protocol}://${host}`
}

export function buildSearchParams<T extends object>(value: T) {
	const params = new URLSearchParams()

	Object.entries(value).forEach(([key, value]) => {
		if (value) updateParams(key, value, params)
	})

	return params
}

export function updateParams(
	key: string,
	value: string | number | string[] | Date,
	params: URLSearchParams,
) {
	if (Array.isArray(value)) {
		params.set(key, value.join(';'))
	} else if (value instanceof Date) {
		params.set(key, value.toISOString())
	} else {
		params.set(key, value.toString())
	}
}

export function getQueryFromParams(request: Request) {
	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, {
		schema: z.object({
			query: z
				.string()
				.trim()
				.optional()
				.transform(v => v ?? ''),
		}),
	})

	invariant(submission.status === 'success', 'invalid criteria')

	return submission.value.query
}
