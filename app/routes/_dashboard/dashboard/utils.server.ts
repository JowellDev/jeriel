import { getMonthSundays } from '~/utils/date'
import type { z } from 'zod'
import { prisma } from '~/infrastructures/database/prisma.server'
import { type filterSchema } from './schema'
import { Role } from '@prisma/client'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import type { EntityType } from '~/helpers/authorized-entities.server'

export { getAuthorizedEntities } from '~/helpers/authorized-entities.server'

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN]

const ACTIVE_MEMBER_FILTER = {
	isActive: true,
	NOT: { roles: { hasSome: ADMIN_ROLES } },
}

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

async function fetchEntityMemberData(
	type: string,
	id: string,
	baseWhere: object,
	page: number,
	take: number,
) {
	const entityFilter = { [`${type}Id`]: id }
	const where = { ...entityFilter, ...baseWhere, ...ACTIVE_MEMBER_FILTER }

	const [members, total, memberCount] = await Promise.all([
		prisma.user.findMany({
			where,
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
		prisma.user.count({ where }),
		prisma.user.count({
			where: { ...entityFilter, ...ACTIVE_MEMBER_FILTER },
		}),
	])

	return { members, total, memberCount }
}

export async function getEntityStats(
	type: EntityType,
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
		members: buildStubMemberAttendances(members),
		total,
	}
}

export function buildStubMemberAttendances(
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
			comment: null,
		})),
		currentMonthMeetings: [
			{
				date: new Date(),
				meetingPresence: null,
				hasConflict: false,
				comment: null,
			},
		],
	}))
}
