import { isWithinInterval } from 'date-fns'
import { prisma } from '~/utils/db.server'
import type { BirthdayMember } from './types'

export async function getAllBirthdaysForWeek(
	startDate: Date,
	endDate: Date,
	churchId: string,
): Promise<BirthdayMember[]> {
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

	return members
		.filter(
			member =>
				member.birthday &&
				isBirthdayInWeek(member.birthday, startDate, endDate),
		)
		.map(member => {
			return {
				id: member.id,
				name: member.name,
				phone: member.phone,
				birthday: member.birthday!,
				gender: member.gender || undefined,
				tribeName: member.tribe?.name || null,
				departmentName: member.department?.name || null,
				honorFamilyName: member.honorFamily?.name || null,
			} as BirthdayMember
		})
}

export async function getBirthdaysForManager(
	managerId: string,
	startDate: Date,
	endDate: Date,
): Promise<{
	birthdays: BirthdayMember[]
	entities: Array<{
		type: 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY'
		id: string
		name: string
	}>
}> {
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
		return { birthdays: [], entities: [] }
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
			},
		})

		const tribeBirthdays = tribeMembers
			.filter(
				member =>
					member.birthday &&
					isBirthdayInWeek(member.birthday, startDate, endDate),
			)
			.map(
				member =>
					({
						id: member.id,
						name: member.name,
						phone: member.phone,
						birthday: member.birthday!,
						tribeName: manager.tribeManager!.name,
						departmentName: null,
						honorFamilyName: null,
					}) as BirthdayMember,
			)

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
			},
		})

		const departmentBirthdays = departmentMembers
			.filter(
				member =>
					member.birthday &&
					isBirthdayInWeek(member.birthday, startDate, endDate),
			)
			.map(
				member =>
					({
						id: member.id,
						name: member.name,
						phone: member.phone,
						birthday: member.birthday!,
						departmentName: manager.managedDepartment!.name,
						tribeName: null,
						honorFamilyName: null,
					}) as BirthdayMember,
			)

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
			},
		})

		const honorFamilyBirthdays = honorFamilyMembers
			.filter(
				member =>
					member.birthday &&
					isBirthdayInWeek(member.birthday, startDate, endDate),
			)
			.map(
				member =>
					({
						id: member.id,
						name: member.name,
						phone: member.phone,
						birthday: member.birthday!,
						honorFamilyName: manager.honorFamilyManager!.name,
						departmentName: null,
						tribeName: null,
					}) as BirthdayMember,
			)

		birthdays.push(...honorFamilyBirthdays)
		entities.push({
			type: 'HONOR_FAMILY',
			id: manager.honorFamilyManager.id,
			name: manager.honorFamilyManager.name,
		})
	}

	birthdays.sort((a, b) => a.name.localeCompare(b.name))

	return { birthdays, entities }
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
