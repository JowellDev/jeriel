export interface Tribe {
	id: string
	name: string
	members: Member[]
	tribeManager: Member
	createdAt: Date
}

export interface Member {
	id: string
	name: string
	phone: string
	location: string
	createdAt: Date
}
