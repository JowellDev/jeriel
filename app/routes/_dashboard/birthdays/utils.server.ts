import { isWithinInterval, parseISO } from 'date-fns'
import { prisma } from '~/utils/db.server'
import type { BirthdayMember } from './types'
import { type FilterSchema } from './schema'

export async function getAllBirthdays(
	filterOptions: FilterSchema,
	churchId: string,
) {
	const { page, take, from, to } = filterOptions
	const startDate = parseISO(from)
	const endDate = parseISO(to)

	const members = await prisma.user.findMany({
		where: {
			churchId,
			isActive: true,
			birthday: { not: null },
			deletedAt: null,
		},
		select: {
			id: true,
			name: true,
			phone: true,
			birthday: true,
			gender: true,
			tribe: {
				select: {
					id: true,
					name: true,
					manager: {
						select: { id: true, name: true },
					},
				},
			},
			department: {
				select: {
					id: true,
					name: true,
					manager: {
						select: { id: true, name: true },
					},
				},
			},
			honorFamily: {
				select: {
					id: true,
					name: true,
					manager: {
						select: { id: true, name: true },
					},
				},
			},
		},
		orderBy: [{ name: 'asc' }],
	})

	const filteredMembers = members.filter(
		m => m.birthday && isBirthdayInWeek(m.birthday, startDate, endDate),
	)

	const totalCount = filteredMembers.length
	const offset = (page - 1) * take
	const paginatedMembers = filteredMembers.slice(offset, offset + take)

	const birthdays = formatMemberData(paginatedMembers)

	return {
		birthdays,
		totalCount,
	}
}

export async function getEntitiesBirthdays(
	managerId: string,
	filterOptions: FilterSchema,
): Promise<{
	birthdays: BirthdayMember[]
	entities: Array<{
		type: 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY'
		id: string
		name: string
	}>
	totalCount: number
}> {
	const { take, page, from, to } = filterOptions
	const startDate = parseISO(from)
	const endDate = parseISO(to)

	const manager = await prisma.user.findUnique({
		where: { id: managerId },
		select: {
			roles: true,
			tribeManager: {
				select: { id: true, name: true },
			},
			managedDepartment: {
				select: { id: true, name: true },
			},
			honorFamilyManager: {
				select: { id: true, name: true },
			},
		},
	})

	if (!manager) {
		return { birthdays: [], entities: [], totalCount: 0 }
	}

	const birthdays: BirthdayMember[] = []
	const entities: Array<{
		type: 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY'
		id: string
		name: string
	}> = []

	if (manager.roles.includes('TRIBE_MANAGER') && manager.tribeManager) {
		const tribeMembers = await prisma.user.findMany({
			where: {
				tribeId: manager.tribeManager.id,
				isActive: true,
				birthday: { not: null },
				deletedAt: null,
			},
			select: {
				id: true,
				name: true,
				phone: true,
				birthday: true,
				pictureUrl: true,
				gender: true,
				tribe: {
					select: {
						name: true,
					},
				},
			},
		})

		const filteredMembers = tribeMembers.filter(
			m => m.birthday && isBirthdayInWeek(m.birthday, startDate, endDate),
		)

		const offset = (page - 1) * take
		const paginatedMembers = filteredMembers.slice(offset, offset + take)

		const tribeBirthdays = formatMemberData(paginatedMembers)

		birthdays.push(...tribeBirthdays)
		entities.push({
			type: 'TRIBE',
			id: manager.tribeManager.id,
			name: manager.tribeManager.name,
		})
	}

	if (
		manager.roles.includes('DEPARTMENT_MANAGER') &&
		manager.managedDepartment
	) {
		const departmentMembers = await prisma.user.findMany({
			where: {
				departmentId: manager.managedDepartment.id,
				isActive: true,
				birthday: { not: null },
				deletedAt: null,
			},
			select: {
				id: true,
				name: true,
				phone: true,
				birthday: true,
				pictureUrl: true,
				gender: true,
				department: {
					select: {
						name: true,
					},
				},
			},
		})

		const filteredMembers = departmentMembers.filter(
			m => m.birthday && isBirthdayInWeek(m.birthday, startDate, endDate),
		)

		const offset = (page - 1) * take
		const paginatedMembers = filteredMembers.slice(offset, offset + take)

		const departmentBirthdays = formatMemberData(paginatedMembers)

		birthdays.push(...departmentBirthdays)
		entities.push({
			type: 'DEPARTMENT',
			id: manager.managedDepartment.id,
			name: manager.managedDepartment.name,
		})
	}

	if (
		manager.roles.includes('HONOR_FAMILY_MANAGER') &&
		manager.honorFamilyManager
	) {
		const honorFamilyMembers = await prisma.user.findMany({
			where: {
				honorFamilyId: manager.honorFamilyManager.id,
				isActive: true,
				birthday: { not: null },
				deletedAt: null,
			},
			select: {
				id: true,
				name: true,
				phone: true,
				birthday: true,
				pictureUrl: true,
				gender: true,
				honorFamily: {
					select: {
						name: true,
					},
				},
			},
		})

		const filteredMembers = honorFamilyMembers.filter(
			m => m.birthday && isBirthdayInWeek(m.birthday, startDate, endDate),
		)

		const offset = (page - 1) * take
		const paginatedMembers = filteredMembers.slice(offset, offset + take)

		const honorFamilyBirthdays = formatMemberData(paginatedMembers)

		birthdays.push(...honorFamilyBirthdays)
		entities.push({
			type: 'HONOR_FAMILY',
			id: manager.honorFamilyManager.id,
			name: manager.honorFamilyManager.name,
		})
	}

	birthdays.sort((a, b) => a.name.localeCompare(b.name))

	return { birthdays, entities, totalCount: birthdays.length }
}

function isBirthdayInWeek(
	birthday: Date,
	startDate: Date,
	endDate: Date,
): boolean {
	const currentYear = startDate.getFullYear()

	const birthdayThisYear = new Date(
		currentYear,
		birthday.getMonth(),
		birthday.getDate(),
	)

	return isWithinInterval(birthdayThisYear, { start: startDate, end: endDate })
}

function formatMemberData(members: any[]): BirthdayMember[] {
	return members.map(member => {
		return {
			id: member.id,
			name: member.name,
			phone: member.phone,
			birthday: member.birthday!,
			gender: member.gender || undefined,
			tribeName: member.tribe?.name || null,
			departmentName: member.department?.name || null,
			honorFamilyName: member.honorFamily?.name || null,
		}
	})
}
