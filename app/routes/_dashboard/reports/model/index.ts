export interface Manager {
	id: string
	name: string
	phone: string
}

export interface ReportData {
	id: string
	name: string
	entityType: 'tribes' | 'departments' | 'honor-families'
	manager: Manager
	createdAt: Date
}
