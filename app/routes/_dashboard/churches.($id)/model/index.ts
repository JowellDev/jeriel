export interface Church {
	id: string
	name: string
	admin: {
		name: string | null
		phone: string | null
		email: string | null
	}
	isActive: boolean
	smsEnabled: boolean
}
