import { isWithinInterval, parseISO } from 'date-fns'
import { prisma } from '~/infrastructures/database/prisma.server'
import type { BirthdayMember, EntityType } from './types'
import { type FilterSchema } from './schema'

async function fetchMembersWithBirthdays(churchId: string) {
	return prisma.user.findMany({
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
			pictureUrl: true,
			gender: true,
			tribe: {
				select: {
					id: true,
					name: true,
					manager: { select: { id: true, name: true } },
				},
			},
			department: {
				select: {
					id: true,
					name: true,
					manager: { select: { id: true, name: true } },
				},
			},
			honorFamily: {
				select: {
					id: true,
					name: true,
					manager: { select: { id: true, name: true } },
				},
			},
		},
	})
}

function filterAndPaginateBirthdays(
	members: any[],
	startDate: Date,
	endDate: Date,
	page: number,
	take: number,
) {
	const filtered = members
		.filter(m => m.birthday && isBirthdayInWeek(m.birthday, startDate, endDate))
		.sort((a, b) =>
			sortBirthdayDesc(a.birthday!, b.birthday!, startDate.getFullYear()),
		)
	const offset = (page - 1) * take
	return {
		items: filtered.slice(offset, offset + take),
		totalCount: filtered.length,
	}
}

export async function getAllBirthdays(
	filterOptions: FilterSchema,
	churchId: string,
) {
	const { page, take, from, to } = filterOptions
	const startDate = parseISO(from)
	const endDate = parseISO(to)
	const members = await fetchMembersWithBirthdays(churchId)
	const { items, totalCount } = filterAndPaginateBirthdays(
		members,
		startDate,
		endDate,
		page,
		take,
	)
	return { birthdays: formatMemberData(items), totalCount }
}

async function fetchManagerWithEntities(managerId: string) {
	return prisma.user.findUnique({
		where: { id: managerId },
		select: {
			roles: true,
			tribeManager: { select: { id: true, name: true } },
			managedDepartment: { select: { id: true, name: true } },
			honorFamilyManager: { select: { id: true, name: true } },
		},
	})
}

type ManagerData = NonNullable<
	Awaited<ReturnType<typeof fetchManagerWithEntities>>
>

type EntityConfig = {
	role: string
	entityType: EntityType
	idKey: 'tribeId' | 'departmentId' | 'honorFamilyId'
	entity: { id: string; name: string } | null | undefined
}

function buildManagerEntityConfigs(manager: ManagerData): EntityConfig[] {
	return [
		{
			role: 'TRIBE_MANAGER',
			entityType: 'TRIBE',
			idKey: 'tribeId',
			entity: manager.tribeManager,
		},
		{
			role: 'DEPARTMENT_MANAGER',
			entityType: 'DEPARTMENT',
			idKey: 'departmentId',
			entity: manager.managedDepartment,
		},
		{
			role: 'HONOR_FAMILY_MANAGER',
			entityType: 'HONOR_FAMILY',
			idKey: 'honorFamilyId',
			entity: manager.honorFamilyManager,
		},
	]
}

async function collectEntityBirthdays(
	manager: ManagerData,
	page: number,
	take: number,
	startDate: Date,
	endDate: Date,
) {
	const birthdays: BirthdayMember[] = []
	const entities: Array<{ type: EntityType; id: string; name: string }> = []
	const commonParams = { page, take, startDate, endDate }

	for (const { role, entityType, idKey, entity } of buildManagerEntityConfigs(
		manager,
	)) {
		if (!manager.roles.includes(role) || !entity) continue
		birthdays.push(
			...(await fetchEntityBirthdays({
				entityType,
				[idKey]: entity.id,
				...commonParams,
			})),
		)
		entities.push({ type: entityType, id: entity.id, name: entity.name })
	}

	return { birthdays, entities }
}

export async function getEntitiesBirthdays(
	managerId: string,
	filterOptions: FilterSchema,
): Promise<{
	birthdays: BirthdayMember[]
	entities: Array<{ type: EntityType; id: string; name: string }>
	totalCount: number
}> {
	const { take, page, from, to } = filterOptions
	const startDate = parseISO(from)
	const endDate = parseISO(to)

	const manager = await fetchManagerWithEntities(managerId)

	if (!manager) return { birthdays: [], entities: [], totalCount: 0 }

	const { birthdays, entities } = await collectEntityBirthdays(
		manager,
		page,
		take,
		startDate,
		endDate,
	)

	birthdays.sort((a, b) =>
		sortBirthdayDesc(
			new Date(a.birthday),
			new Date(b.birthday),
			startDate.getFullYear(),
		),
	)

	return { birthdays, entities, totalCount: birthdays.length }
}

function buildEntityBirthdayWhere(
	entityType: EntityType,
	tribeId?: string,
	departmentId?: string,
	honorFamilyId?: string,
) {
	return {
		...(entityType === 'TRIBE' && { tribeId }),
		...(entityType === 'DEPARTMENT' && { departmentId }),
		...(entityType === 'HONOR_FAMILY' && { honorFamilyId }),
		isActive: true,
		birthday: { not: null },
		deletedAt: null,
	}
}

async function fetchEntityBirthdays(params: {
	entityType: EntityType
	tribeId?: string
	departmentId?: string
	honorFamilyId?: string
	page: number
	take: number
	startDate: Date
	endDate: Date
}): Promise<BirthdayMember[]> {
	const {
		entityType,
		tribeId,
		departmentId,
		honorFamilyId,
		page,
		take,
		startDate,
		endDate,
	} = params

	const membersRaw = await prisma.user.findMany({
		where: buildEntityBirthdayWhere(
			entityType,
			tribeId,
			departmentId,
			honorFamilyId,
		),
		select: {
			id: true,
			name: true,
			phone: true,
			birthday: true,
			location: true,
			pictureUrl: true,
			gender: true,
			tribe: { select: { name: true } },
			department: { select: { name: true } },
			honorFamily: { select: { name: true } },
		},
	})

	const { items } = filterAndPaginateBirthdays(
		membersRaw,
		startDate,
		endDate,
		page,
		take,
	)

	return formatMemberData(items)
}

function sortBirthdayDesc(a: Date, b: Date, year: number): number {
	const dateA = new Date(year, a.getMonth(), a.getDate()).getTime()
	const dateB = new Date(year, b.getMonth(), b.getDate()).getTime()
	return dateB - dateA
}

function isBirthdayInWeek(
	birthday: Date,
	startDate: Date,
	endDate: Date,
): boolean {
	const birthdayThisYear = new Date(
		startDate.getFullYear(),
		birthday.getMonth(),
		birthday.getDate(),
	)

	return isWithinInterval(birthdayThisYear, { start: startDate, end: endDate })
}

function formatMemberData(members: any[]): BirthdayMember[] {
	return members.map(member => ({
		id: member.id,
		name: member.name,
		phone: member.phone,
		birthday: member.birthday!,
		location: member.location!,
		pictureUrl: member.pictureUrl!,
		gender: member.gender || undefined,
		tribeName: member.tribe?.name || null,
		departmentName: member.department?.name || null,
		honorFamilyName: member.honorFamily?.name || null,
	}))
}
