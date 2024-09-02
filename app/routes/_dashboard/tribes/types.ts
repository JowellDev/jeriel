export interface Tribe {
	id: string
	name: string
	members: Member[]
	manager: Member
	createdAt: Date
}

export interface Member {
	id: string
	name: string
	phone: string
	location: string
	isAdmin: boolean
	createdAt: Date
}

export interface FileData {
	[key: string]: string
}

export interface CreateMemberPayload {
	name: string
	phone: string
	location: string
}
