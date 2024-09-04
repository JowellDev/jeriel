export function stringify(values: string[] | string): string {
	return JSON.stringify(values)
}

export function formatAsSelectFieldsData(data: { id: string; name: string }[]) {
	return data.map(data => ({
		...data,
		label: data.name,
		value: data.id,
	}))
}
