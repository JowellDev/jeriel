import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { getMonthSundays } from '~/utils/date'
import type { z } from 'zod'
import type { AuthorizedEntity, User } from './types'
import { prisma } from '~/utils/db.server'
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

export async function getAuthorizedEntities(
	user: User,
): Promise<AuthorizedEntity[]> {
	const authorizedEntities: { type: string; id: string; name?: string }[] = []

	const [managedTribe, managedDepartment, managedHonorFamily] =
		await Promise.all([
			prisma.tribe.findUnique({
				where: { managerId: user.id },
				select: { id: true, name: true },
			}),
			prisma.department.findUnique({
				where: { managerId: user.id },
				select: { id: true, name: true },
			}),
			prisma.honorFamily.findUnique({
				where: { managerId: user.id },
				select: { id: true, name: true },
			}),
		])

	if (managedTribe) authorizedEntities.push({ type: 'tribe', ...managedTribe })

	if (managedDepartment)
		authorizedEntities.push({ type: 'department', ...managedDepartment })

	if (managedHonorFamily)
		authorizedEntities.push({ type: 'honorFamily', ...managedHonorFamily })

	if (user.roles.includes('TRIBE_MANAGER') && user.tribeId) {
		authorizedEntities.push({
			type: 'tribe',
			id: user.tribeId,
			name: user.tribe?.name,
		})
	}
	if (user.roles.includes('DEPARTMENT_MANAGER') && user.departmentId) {
		authorizedEntities.push({
			type: 'department',
			id: user.departmentId,
			name: user.department?.name,
		})
	}
	if (user.roles.includes('HONOR_FAMILY_MANAGER') && user.honorFamilyId) {
		authorizedEntities.push({
			type: 'honorFamily',
			id: user.honorFamilyId,
			name: user.honorFamily?.name,
		})
	}

	return Array.from(
		new Set(authorizedEntities.map(e => JSON.stringify(e))),
	).map(e => JSON.parse(e)) as AuthorizedEntity[]
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

	let entityName: { name: string } | null

	const members = await prisma.user.findMany({
		where: {
			[`${type}Id`]: id,
			...baseWhere,
		},
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
		take: filterValue.page * filterValue.take,
	})

	const total = await prisma.user.count({
		where: { [`${type}Id`]: id, ...baseWhere },
	})

	switch (type) {
		case 'tribe':
			entityName = await prisma.tribe.findUnique({
				where: { id },
				select: { name: true },
			})

			break

		case 'honorFamily':
			entityName = await prisma.honorFamily.findUnique({
				where: { id },
				select: { name: true },
			})

			break

		case 'department':
			entityName = await prisma.department.findUnique({
				where: { id },
				select: { name: true },
			})

			break
	}

	return {
		id,
		type,
		entityName: entityName?.name,
		memberCount: members.length,
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
			{
				date: new Date(),
				meetingPresence: null,
				hasConflict: false,
			},
		],
	}))
}
