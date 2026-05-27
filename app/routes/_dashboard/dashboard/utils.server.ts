import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { getMonthSundays } from '~/utils/date'
import type { z } from 'zod'
import type { AuthorizedEntity, User } from './types'
import { prisma } from '~/infrastructures/database/prisma.server'
import { type filterSchema } from './schema'

export async function getEntityName(entity: { type: string; id: string }) {
	switch (entity.type) {
		case 'tribe':
			return prisma.tribe.findUnique({
				where: { id: entity.id },
				select: { name: true },
			})
		case 'honorFamily':
			return prisma.honorFamily.findUnique({
				where: { id: entity.id },
				select: { name: true },
			})
		case 'department':
			return prisma.department.findUnique({
				where: { id: entity.id },
				select: { name: true },
			})
	}
}

async function fetchManagedEntities(userId: string) {
	const [managedTribe, managedDepartment, managedHonorFamily] =
		await Promise.all([
			prisma.tribe.findUnique({
				where: { managerId: userId },
				select: { id: true, name: true },
			}),
			prisma.department.findUnique({
				where: { managerId: userId },
				select: { id: true, name: true },
			}),
			prisma.honorFamily.findUnique({
				where: { managerId: userId },
				select: { id: true, name: true },
			}),
		])

	return { managedTribe, managedDepartment, managedHonorFamily }
}

function extractRoleEntities(user: User): AuthorizedEntity[] {
	const entities: AuthorizedEntity[] = []
	if (user.roles.includes('TRIBE_MANAGER') && user.tribeId) {
		entities.push({ type: 'tribe', id: user.tribeId, name: user.tribe?.name })
	}

	if (user.roles.includes('DEPARTMENT_MANAGER') && user.departmentId) {
		entities.push({
			type: 'department',
			id: user.departmentId,
			name: user.department?.name,
		})
	}

	if (user.roles.includes('HONOR_FAMILY_MANAGER') && user.honorFamilyId) {
		entities.push({
			type: 'honorFamily',
			id: user.honorFamilyId,
			name: user.honorFamily?.name,
		})
	}

	return entities
}

function deduplicateEntities(entities: AuthorizedEntity[]): AuthorizedEntity[] {
	const unique = new Map<string, AuthorizedEntity>()

	for (const entity of entities)
		unique.set(`${entity.type}-${entity.id}`, entity)

	return Array.from(unique.values())
}

export async function getAuthorizedEntities(
	user: User,
): Promise<AuthorizedEntity[]> {
	const { managedTribe, managedDepartment, managedHonorFamily } =
		await fetchManagedEntities(user.id)

	const managed: AuthorizedEntity[] = [
		...(managedTribe ? [{ type: 'tribe' as const, ...managedTribe }] : []),
		...(managedDepartment
			? [{ type: 'department' as const, ...managedDepartment }]
			: []),
		...(managedHonorFamily
			? [{ type: 'honorFamily' as const, ...managedHonorFamily }]
			: []),
		...extractRoleEntities(user),
	]

	return deduplicateEntities(managed)
}

async function fetchEntityName(type: string, id: string) {
	switch (type) {
		case 'tribe':
			return prisma.tribe.findUnique({ where: { id }, select: { name: true } })
		case 'honorFamily':
			return prisma.honorFamily.findUnique({
				where: { id },
				select: { name: true },
			})
		default:
			return prisma.department.findUnique({
				where: { id },
				select: { name: true },
			})
	}
}

const SOFT_DELETE_FILTER = {
	NOT: { isActive: false, deletedAt: { not: null } },
}

async function fetchEntityMemberData(
	type: string,
	id: string,
	baseWhere: object,
	page: number,
	take: number,
) {
	const entityFilter = { [`${type}Id`]: id }
	const [members, total, memberCount] = await Promise.all([
		prisma.user.findMany({
			where: { ...entityFilter, ...baseWhere, ...SOFT_DELETE_FILTER },
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				location: true,
				integrationDate: true,
				pictureUrl: true,
				birthday: true,
				maritalStatus: true,
				gender: true,
				createdAt: true,
			},
			take: page * take,
		}),
		prisma.user.count({
			where: { ...entityFilter, ...baseWhere, ...SOFT_DELETE_FILTER },
		}),
		prisma.user.count({ where: { ...entityFilter, ...SOFT_DELETE_FILTER } }),
	])

	return { members, total, memberCount }
}

export async function getEntityStats(
	type: 'tribe' | 'department' | 'honorFamily',
	id: string,
	filterValue: z.infer<typeof filterSchema>,
) {
	const baseWhere = {
		createdAt: {
			gte: new Date(filterValue.from),
			lte: new Date(filterValue.to),
		},
	}

	const [{ members, total, memberCount }, entityName] = await Promise.all([
		fetchEntityMemberData(
			type,
			id,
			baseWhere,
			filterValue.page,
			filterValue.take,
		),
		fetchEntityName(type, id),
	])

	return {
		id,
		type,
		entityName: entityName?.name,
		memberCount,
		members: getMembersAttendances(members),
		total,
	}
}

export function getMembersAttendances(
	members: Member[],
): MemberMonthlyAttendances[] {
	const currentMonthSundays = getMonthSundays(new Date())
	return members.map(member => ({
		...member,
		previousMonthAttendanceResume: null,
		currentMonthAttendanceResume: null,
		previousMonthMeetingResume: null,
		currentMonthMeetingResume: null,
		currentMonthAttendances: currentMonthSundays.map(sunday => ({
			sunday,
			churchPresence: null,
			servicePresence: null,
			meetingPresence: null,
			hasConflict: false,
		})),
		currentMonthMeetings: [
			{ date: new Date(), meetingPresence: null, hasConflict: false },
		],
	}))
}
