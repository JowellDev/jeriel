export type HonorFamily = {
	name: string
	createdAt: Date
	members: { id: string }[]
	admin: { name: string | null; phone: string }
}

export type LoadingApiFormData = {
	users: SelectInputData[]
	churchs: SelectInputData[]
}

type SelectInputData = { label: string; value: string }
