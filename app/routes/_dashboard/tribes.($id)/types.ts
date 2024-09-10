export interface Tribe {
	id: string
	name: string
	members: { id: string; name: string }[]
	manager: { id: string; name: string; phone: string; isAdmin: boolean }
	createdAt: Date
}

export interface Member {
	id: string
	name: string
	phone: string
	location: string
	isAdmin: boolean
	createdAt: Date
}

export type ApiFormData = {
	admins: (SelectInputData & { isAdmin: boolean })[]
	members: SelectInputData[]
}

type SelectInputData = { label: string; value: string }

export interface FileData {
	[key: string]: string
}

export interface CreateMemberPayload {
	name: string
	phone: string
	location: string
}
