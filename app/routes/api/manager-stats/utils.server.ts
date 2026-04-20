import { type User, type Prisma, AttendanceReportEntity } from '@prisma/client'
import { prisma } from '~/infrastructures/database/prisma.server'
import { type z } from 'zod'
import { type schema } from './schema'
import { isSameMonth } from 'date-fns'
import {
	type EntityType,
	type AuthorizedEntity,
	type Attendance,
	type AttendanceReport,
	type AttendanceStats,
	type Member,
} from './types'

export async function getAuthorizedEntities(
	user: User,
): Promise<AuthorizedEntity[]> {
	const authorizedEntities: { type: string; id: string; name?: string }[] = []

	const [managedTribe, managedDepartment, managedHonorFamily] =
		await Promise.all([
			prisma.tribe.findUnique({
				where: { managerId: user.id },
				select: { id: true },
			}),
			prisma.department.findUnique({
				where: { managerId: user.id },
				select: { id: true },
			}),
			prisma.honorFamily.findUnique({
				where: { managerId: user.id },
				select: { id: true },
			}),
		])

	if (managedTribe) authorizedEntities.push({ type: 'tribe', ...managedTribe })
	if (managedDepartment)
		authorizedEntities.push({ type: 'department', ...managedDepartment })
	if (managedHonorFamily)
		authorizedEntities.push({ type: 'honorFamily', ...managedHonorFamily })

	if (user.roles.includes('TRIBE_MANAGER') && user.tribeId) {
		authorizedEntities.push({ type: 'tribe', id: user.tribeId })
	}
	if (user.roles.includes('DEPARTMENT_MANAGER') && user.departmentId) {
		authorizedEntities.push({ type: 'department', id: user.departmentId })
	}
	if (user.roles.includes('HONOR_FAMILY_MANAGER') && user.honorFamilyId) {
		authorizedEntities.push({ type: 'honorFamily', id: user.honorFamilyId })
	}

	const unique = new Map<string, AuthorizedEntity>()
	for (const entity of authorizedEntities) {
		unique.set(`${entity.type}-${entity.id}`, entity as AuthorizedEntity)
	}
	return Array.from(unique.values())
}

export async function getEntityMembers(
	entities: AuthorizedEntity[],
	churchId: string,
	currentUserId: string,
): Promise<Member[]> {
	if (entities.length === 0) return []

	const entitiesByType: Record<EntityType, string[]> = {
		tribe: [],
		department: [],
		honorFamily: [],
	}

	entities.forEach(entity => {
		entitiesByType[entity.type].push(entity.id)
	})

	const whereCondition: Prisma.UserWhereInput = {
		churchId,
		id: { not: currentUserId },
		NOT: { isActive: false, deletedAt: { not: null } },
	}

	if (entitiesByType.tribe.length > 0) {
		whereCondition.tribeId = { in: entitiesByType.tribe }
	}
	if (entitiesByType.department.length > 0) {
		whereCondition.departmentId = { in: entitiesByType.department }
	}
	if (entitiesByType.honorFamily.length > 0) {
		whereCondition.honorFamilyId = { in: entitiesByType.honorFamily }
	}

	return prisma.user.findMany({
		where: whereCondition,
		select: { id: true, name: true, createdAt: true },
	})
}

export async function fetchAttendanceReports(
	entities: AuthorizedEntity[],
	memberIds: string[],
	filter: z.infer<typeof schema>,
): Promise<AttendanceReport[]> {
	const { from, to } = filter

	const dateFilter = {
		attendances: {
			every: { date: { gte: new Date(from), lte: new Date(to) } },
		},
	}

	const memberFilter = {
		attendances: {
			where: { memberId: { in: memberIds } },
			select: {
				id: true,
				memberId: true,
				date: true,
				inChurch: true,
				inService: true,
				inMeeting: true,
			},
		},
	}

	const allQueries = []

	for (const entity of entities) {
		const queries = []

		if (entity.type === 'tribe') {
			queries.push(
				prisma.attendanceReport.findMany({
					where: {
						...dateFilter,
						entity: AttendanceReportEntity.TRIBE,
						tribeId: entity.id,
					},
					include: memberFilter,
				}),
			)
		} else if (entity.type === 'department') {
			queries.push(
				prisma.attendanceReport.findMany({
					where: {
						...dateFilter,
						entity: AttendanceReportEntity.DEPARTMENT,
						departmentId: entity.id,
					},
					include: memberFilter,
				}),
			)
		} else if (entity.type === 'honorFamily') {
			queries.push(
				prisma.attendanceReport.findMany({
					where: {
						...dateFilter,
						entity: AttendanceReportEntity.HONOR_FAMILY,
						honorFamilyId: entity.id,
					},
					include: memberFilter,
				}),
			)

			const users = await prisma.user.findMany({
				where: { honorFamilyId: entity.id, id: { in: memberIds } },
				select: { id: true, tribeId: true, departmentId: true },
			})

			const tribeIds = users.filter(u => u.tribeId).map(u => u.tribeId)
			if (tribeIds.length > 0) {
				queries.push(
					prisma.attendanceReport.findMany({
						where: {
							...dateFilter,
							entity: AttendanceReportEntity.TRIBE,
							tribeId: { in: tribeIds as string[] },
						},
						include: memberFilter,
					}),
				)
			}

			const departmentIds = users
				.filter(u => u.departmentId)
				.map(u => u.departmentId)
			if (departmentIds.length > 0) {
				queries.push(
					prisma.attendanceReport.findMany({
						where: {
							...dateFilter,
							entity: AttendanceReportEntity.DEPARTMENT,
							departmentId: { in: departmentIds as string[] },
						},
						include: memberFilter,
					}),
				)
			}
		}

		allQueries.push(...queries)
	}

	const results = await Promise.all(allQueries)
	return results.flat() as unknown as AttendanceReport[]
}

export function getAttendancesStats(
	members: Member[],
	attendances: AttendanceReport[],
	currentMonthSundays: Date[],
): AttendanceStats | null {
	const totalSundays = currentMonthSundays.length
	if (totalSundays === 0) return null

	const allAttendances: Attendance[] = attendances.flatMap(
		report => report.attendances,
	)
	const attendancesByMember = allAttendances.reduce(
		(acc, attendance) => {
			if (!acc[attendance.memberId]) acc[attendance.memberId] = []
			acc[attendance.memberId].push(attendance)
			return acc
		},
		{} as Record<string, Attendance[]>,
	)

	const stats = {
		church: { totalPresence: 0, totalAbsence: 0, newMembersPresence: 0, newMembersAbsence: 0, oldMembersPresence: 0, oldMembersAbsence: 0 },
		service: { totalPresence: 0, totalAbsence: 0, newMembersPresence: 0, newMembersAbsence: 0, oldMembersPresence: 0, oldMembersAbsence: 0 },
		meeting: { totalPresence: 0, totalAbsence: 0, newMembersPresence: 0, newMembersAbsence: 0, oldMembersPresence: 0, oldMembersAbsence: 0 },
	}

	members.forEach(member => {
		const memberAttendances = attendancesByMember[member.id] || []
		const isNewMember = isSameMonth(new Date(member.createdAt), new Date())

		memberAttendances.forEach(attendance => {
			if (attendance.inChurch === true) {
				stats.church.totalPresence++
				isNewMember ? stats.church.newMembersPresence++ : stats.church.oldMembersPresence++
			} else if (attendance.inChurch === false) {
				stats.church.totalAbsence++
				isNewMember ? stats.church.newMembersAbsence++ : stats.church.oldMembersAbsence++
			}
			if (attendance.inService === true) {
				stats.service.totalPresence++
				isNewMember ? stats.service.newMembersPresence++ : stats.service.oldMembersPresence++
			} else if (attendance.inService === false) {
				stats.service.totalAbsence++
				isNewMember ? stats.service.newMembersAbsence++ : stats.service.oldMembersAbsence++
			}
			if (attendance.inMeeting === true) {
				stats.meeting.totalPresence++
				isNewMember ? stats.meeting.newMembersPresence++ : stats.meeting.oldMembersPresence++
			} else if (attendance.inMeeting === false) {
				stats.meeting.totalAbsence++
				isNewMember ? stats.meeting.newMembersAbsence++ : stats.meeting.oldMembersAbsence++
			}
		})
	})

	return {
		culte: {
			averageGeneralAttendance: stats.church.totalPresence / totalSundays,
			averageNewMembersAttendance: stats.church.newMembersPresence / totalSundays,
			averageOldMembersAttendance: stats.church.oldMembersPresence / totalSundays,
			averageGeneralAbsence: stats.church.totalAbsence / totalSundays,
			averageNewMembersAbsence: stats.church.newMembersAbsence / totalSundays,
			averageOldMembersAbsence: stats.church.oldMembersAbsence / totalSundays,
		},
		service: {
			averageGeneralAttendance: stats.service.totalPresence / totalSundays,
			averageNewMembersAttendance: stats.service.newMembersPresence / totalSundays,
			averageOldMembersAttendance: stats.service.oldMembersPresence / totalSundays,
			averageGeneralAbsence: stats.service.totalAbsence / totalSundays,
			averageNewMembersAbsence: stats.service.newMembersAbsence / totalSundays,
			averageOldMembersAbsence: stats.service.oldMembersAbsence / totalSundays,
		},
		reunion: {
			averageGeneralAttendance: stats.meeting.totalPresence / totalSundays,
			averageNewMembersAttendance: stats.meeting.newMembersPresence / totalSundays,
			averageOldMembersAttendance: stats.meeting.oldMembersPresence / totalSundays,
			averageGeneralAbsence: stats.meeting.totalAbsence / totalSundays,
			averageNewMembersAbsence: stats.meeting.newMembersAbsence / totalSundays,
			averageOldMembersAbsence: stats.meeting.oldMembersAbsence / totalSundays,
		},
	}
}
