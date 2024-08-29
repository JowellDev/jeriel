export type HonorFamily = {
	name: string
	createdAt: Date
	members: { id: string }[]
	manager: { name: string | null; phone: string }
}

export type LoadingApiFormData = {
	users: SelectInputData[]
	members: SelectInputData[]
}

type SelectInputData = { label: string; value: string }
