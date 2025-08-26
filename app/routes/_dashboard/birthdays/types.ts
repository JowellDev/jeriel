export interface BirthdayMember {
	id: string
	name: string
	phone: string
	birthday: Date | string
	tribeName: string | null
	departmentName: string | null
	honorFamilyName: string | null
}

export interface BirthdayData {
	startDate: string
	endDate: string
	birthdays: BirthdayMember[]
	totalCount: number
	userPermissions: {
		canSeeAll: boolean
		managedEntities: Array<{
			type: EntityType
			id: string
			name: string
		}>
	}
}

export type EntityType = 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY'
