export type HonorFamily = {
	name: string
	createdAt: Date
	members: { id: string }[]
	manager: { name: string | null; phone: string }
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
