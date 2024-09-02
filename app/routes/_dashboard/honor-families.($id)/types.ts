export type HonorFamily = {
	name: string
	createdAt: Date
	location: string
	members: { id: string; name: string }[]
	manager: { id: string; name: string; phone: string; isAdmin: boolean }
}

export type LoadingApiFormData = {
	admins: (SelectInputData & { isAdmin: boolean })[]
	members: SelectInputData[]
}

export interface Member {
	id: string
	name: string
	phone: string
	location: string
	createdAt: Date
}

type SelectInputData = { label: string; value: string }
