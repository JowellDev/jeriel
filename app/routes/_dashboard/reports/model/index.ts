export interface Manager {
	id: string
	name: string
	phone: string
}

export interface ReportData {
	id: string
	name: string
	entityType: 'tribe' | 'department' | 'honorFamily'
	manager: Manager
	createdAt: Date
}
