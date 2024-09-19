export interface Member {
	id: string
	name: string
	phone: string
}

export interface Department {
	id: string
	name: string
	manager: {
		id?: string
		name: string
		phone: string
	}
	members: Member[]
	createdAt: string
}
