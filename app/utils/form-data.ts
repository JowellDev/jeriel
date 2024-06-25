export function buildFormData(data: Record<string, string>) {
	const body = new FormData()

	for (const [key, value] of Object.entries({
		...data,
	})) {
		body.append(key, value)
	}

	return body
}
