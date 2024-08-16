export interface Church {
	id: string
	name: string
	admin: {
		fullname: string | null
		phone: string
	}
	isActive: boolean
}
