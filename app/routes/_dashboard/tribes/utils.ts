export function stringify(values: string[] | string): string {
	return JSON.stringify(values)
}

export function transformApiData(
	data: { id: string; name: string; phone: string }[],
) {
	return data.map(({ id, name, phone }) => ({
		value: id,
		label: name ?? phone,
	}))
}
