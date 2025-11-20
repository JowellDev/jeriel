export interface User {
	id: string
	name: string
	phone: string | null
	deletedAt: string | null
}

export interface ArchiveRequest {
	id?: string
	origin?: string
	status?: string | null
	usersToArchive: User[]
	createdAt?: string
	requester?: {
		id?: string
		name?: string
		phone?: string | null
		isAdmin?: boolean
	}
}
