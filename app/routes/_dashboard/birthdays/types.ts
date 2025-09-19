export interface BirthdayMember {
	id: string
	name: string
	phone: string
	location: string
	birthday: Date | string
	gender: string
	pictureUrl: string
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
