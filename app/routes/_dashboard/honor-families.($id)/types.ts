export type HonorFamily = {
	name: string
	createdAt: Date
	members: { id: string }[]
	admin: { name: string | null; phone: string }
}

export type LoadingApiFormData = {
	users: SelectInputData[]
	admins: SelectInputData[]
}

type SelectInputData = { label: string; value: string }
