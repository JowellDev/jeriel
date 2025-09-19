export interface Church {
	id: string
	name: string
	admin: {
		name: string | null
		phone: string
	}
	isActive: boolean
	smsEnabled: boolean
}
