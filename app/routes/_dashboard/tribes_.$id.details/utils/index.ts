import type { Member } from '~/models/member.model'
import type { SelectInputData } from '../types'

export const createOptions = (data: Member[]): SelectInputData[] =>
	data.map(({ id, name }) => ({ label: name, value: id }))

export const filterUniqueOptions = (
	options: SelectInputData[],
): SelectInputData[] => {
	const countMap = new Map<string, number>()

	options.forEach(option => {
		countMap.set(option.value, (countMap.get(option.value) || 0) + 1)
	})

	return options.filter(option => countMap.get(option.value) === 1)
}
