export type HonorFamily = {
	id: string
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

export type HonorFamilyExport = {
	name: string
	manager: {
		name: string
		phone: string
	}
	members: { id: string }[]
}

type SelectInputData = { label: string; value: string }

export interface CreateFileData {
	honorFamilies: HonorFamilyExport[]
	baseUrl: string
	customerName: string
}
