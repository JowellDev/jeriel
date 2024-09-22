import { SelectInputData } from '../types'

export function formatAsSelectFieldsData(
	data: { id: string; name: string; isAdmin?: boolean }[],
) {
	return data.map(data => ({
		...data,
		label: data.name,
		value: data.id,
	}))
}

export const getUniqueOptions = (
	options: SelectInputData[],
): SelectInputData[] => {
	const uniqueValues = new Set<string>()
	return options.filter(option => {
		if (uniqueValues.has(option.value)) {
			return false
		}
		uniqueValues.add(option.value)
		return true
	})
}
