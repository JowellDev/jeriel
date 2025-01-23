import type { Option } from '~/components/form/multi-selector'

export const getUniqueOptions = (
	members: { id: string; name: string }[],
	assistants: { id: string; name: string }[],
): Option[] => {
	const allOptions = [
		...members.map(member => ({ label: member.name, value: member.id })),
		...assistants.map(assistant => ({
			label: assistant.name,
			value: assistant.id,
		})),
	]

	return allOptions.reduce((acc, current) => {
		const x = acc.find(
			item => item.value === current.value && item.label === current.label,
		)
		if (!x) {
			return acc.concat([current])
		} else {
			return acc
		}
	}, [] as Option[])
}
