export interface UserToArchive {
	id: string
	name: string
	phone: string
	deletedAt: string | null
}

export interface ArchiveRequest {
	id: string
	requester: {
		id?: string
		name: string
		phone: string
		isAdmin: boolean
	}
	origin: string
	usersToArchive: UserToArchive[]
	createdAt: string
}
