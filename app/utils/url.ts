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
