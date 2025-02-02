import { Option } from '~/components/form/multi-selector'

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
	members: { id: string; name: string }[],
	assistants: { id: string; name: string }[],
): Option[] => {
	const assistantIds = new Set(assistants.map(assistant => assistant.id))

	return formatAsSelectFieldsData(
		members.filter(member => !assistantIds.has(member.id)),
	)
}
