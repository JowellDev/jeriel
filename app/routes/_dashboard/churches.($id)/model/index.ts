export interface Church {
	id: string
	name: string
	user: {
		fullname: string | null
		phone: string
	}
	isActive: boolean
}
