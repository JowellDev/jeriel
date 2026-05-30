export interface User {
	id: string
	name: string
	phone: string | null
	deletedAt: string | null
	pictureUrl?: string | null
}

export interface ArchiveRequest {
	id?: string
	requester?: {
		id?: string
		name?: string
		phone?: string | null
		isAdmin?: boolean
	}
	origin?: string
	usersToArchive: User[]
	createdAt?: string
}
