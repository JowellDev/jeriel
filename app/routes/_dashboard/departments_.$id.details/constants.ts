import type { ViewOption } from '~/components/toolbar'

export const stateFilterData = [
	{ value: 'ALL', label: 'Tous les états' },
	{ value: 'VERY_REGULAR', label: 'Tres régulier' },
	{ value: 'REGULAR', label: 'Régulier' },
	{ value: 'MEDIUM_REGULAR', label: 'Moyennement régulier' },
	{ value: 'LITTLE_REGULAR', label: 'Peu régulier' },
	{ value: 'ABSENT', label: 'Absent' },
]

export const statusFilterData = [
	{ value: 'ALL', label: 'Tous les statuts' },
	{ value: 'NEW', label: 'Nouveau' },
	{ value: 'OLD', label: 'Ancien' },
]

export const VIEWS_OPTIONS: { id: ViewOption; label: string }[] = [
	{
		id: 'CULTE',
		label: 'Culte',
	},
	{
		id: 'SERVICE',
		label: 'Service',
	},
	{
		id: 'STAT',
		label: 'Statistiques',
	},
]

export const FORM_INTENT = {
	CREATE: 'create_member',
	UPLOAD: 'upload_members',
	ADD_ASSISTANT: 'add_assistant',
}
