export interface User {
	id: string
	name: string
	phone: string
	deletedAt: string | null
}

export interface ArchiveRequest {
	id?: string
	requester?: {
		id?: string
		name?: string
		phone?: string
		isAdmin?: boolean
	}
	origin?: string
	status?: string | null
	usersToArchive: User[]
	createdAt?: string
}
