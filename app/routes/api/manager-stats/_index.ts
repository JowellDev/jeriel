import { parseWithZod } from '@conform-to/zod'
import { type User, type Prisma, AttendanceReportEntity } from '@prisma/client'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { schema } from './schema'
import { type z } from 'zod'
import { isSameMonth } from 'date-fns'
import { prepareDateRanges } from '~/utils/attendance.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const url = new URL(request.url)

	const submission = parseWithZod(url.searchParams, { schema })

	if (submission.status != 'success') return 'error'

	invariant(currentUser.churchId, '')

	const { value } = submission

	const { currentMonthSundays } = prepareDateRanges(new Date(value.to))

	const authorizedEntities = await getAuthorizedEntities(currentUser)

	const allMembers = await getEntityMembers(
		authorizedEntities,
		currentUser.churchId,
		currentUser.id,
	)

	const memberIds = allMembers.map(m => m.id)

	const attendancesReports = await fetchAttendanceReports(
		authorizedEntities,
		memberIds,
		value,
	)

	const stats = getAttendancesStats(
		allMembers,
		attendancesReports,
		currentMonthSundays,
	)

	return json({ stats })
}

export type EntityType = 'tribe' | 'department' | 'honorFamily'

export interface AuthorizedEntity {
	type: EntityType
	id: string
	name?: string
}

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
		authorizedEntities.push({
			type: 'tribe',
			id: user.tribeId,
		})
	}
	if (user.roles.includes('DEPARTMENT_MANAGER') && user.departmentId) {
		authorizedEntities.push({
			type: 'department',
			id: user.departmentId,
		})
	}
	if (user.roles.includes('HONOR_FAMILY_MANAGER') && user.honorFamilyId) {
		authorizedEntities.push({
			type: 'honorFamily',
			id: user.honorFamilyId,
		})
	}

	return Array.from(
		new Set(authorizedEntities.map(e => JSON.stringify(e))),
	).map(e => JSON.parse(e)) as AuthorizedEntity[]
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
		select: {
			id: true,
			name: true,
			createdAt: true,
		},
	})
}

async function fetchAttendanceReports(
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

	const queries = entities.map(entity => {
		let query: Prisma.AttendanceReportFindManyArgs = {
			where: {
				...dateFilter,
			},
			include: memberFilter,
		}

		if (!query.where) {
			query.where = {}
		}
		if (entity.type === 'tribe') {
			query.where.entity = AttendanceReportEntity.TRIBE
			query.where.tribeId = entity.id
		} else if (entity.type === 'department') {
			query.where.entity = AttendanceReportEntity.DEPARTMENT
			query.where.departmentId = entity.id
		} else if (entity.type === 'honorFamily') {
			query.where.entity = AttendanceReportEntity.HONOR_FAMILY
			query.where.honorFamilyId = entity.id
		}

		return prisma.attendanceReport.findMany(query)
	})

	const results = await Promise.all(queries)
	return results.flat() as unknown as AttendanceReport[]
}

interface Member {
	id: string
	name: string
	createdAt: Date | string
	tribeId?: string
	departmentId?: string
	honorFamilyId?: string
}

function getAttendancesStats(
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
			if (!acc[attendance.memberId]) {
				acc[attendance.memberId] = []
			}
			acc[attendance.memberId].push(attendance)
			return acc
		},
		{} as Record<string, Attendance[]>,
	)

	const stats = {
		church: {
			totalPresence: 0,
			totalAbsence: 0,
			newMembersPresence: 0,
			newMembersAbsence: 0,
			oldMembersPresence: 0,
			oldMembersAbsence: 0,
		},
		service: {
			totalPresence: 0,
			totalAbsence: 0,
			newMembersPresence: 0,
			newMembersAbsence: 0,
			oldMembersPresence: 0,
			oldMembersAbsence: 0,
		},
		meeting: {
			totalPresence: 0,
			totalAbsence: 0,
			newMembersPresence: 0,
			newMembersAbsence: 0,
			oldMembersPresence: 0,
			oldMembersAbsence: 0,
		},
	}

	members.forEach(member => {
		const memberAttendances = attendancesByMember[member.id] || []
		const isNewMember = isSameMonth(new Date(member.createdAt), new Date())

		memberAttendances.forEach(attendance => {
			if (attendance.inChurch === true) {
				stats.church.totalPresence++
				if (isNewMember) {
					stats.church.newMembersPresence++
				} else {
					stats.church.oldMembersPresence++
				}
			} else if (attendance.inChurch === false) {
				stats.church.totalAbsence++
				if (isNewMember) {
					stats.church.newMembersAbsence++
				} else {
					stats.church.oldMembersAbsence++
				}
			}

			if (attendance.inService === true) {
				stats.service.totalPresence++
				if (isNewMember) {
					stats.service.newMembersPresence++
				} else {
					stats.service.oldMembersPresence++
				}
			} else if (attendance.inService === false) {
				stats.service.totalAbsence++
				if (isNewMember) {
					stats.service.newMembersAbsence++
				} else {
					stats.service.oldMembersAbsence++
				}
			}

			if (attendance.inMeeting === true) {
				stats.meeting.totalPresence++
				if (isNewMember) {
					stats.meeting.newMembersPresence++
				} else {
					stats.meeting.oldMembersPresence++
				}
			} else if (attendance.inMeeting === false) {
				stats.meeting.totalAbsence++
				if (isNewMember) {
					stats.meeting.newMembersAbsence++
				} else {
					stats.meeting.oldMembersAbsence++
				}
			}
		})
	})

	return {
		culte: {
			averageGeneralAttendance: stats.church.totalPresence / totalSundays,
			averageNewMembersAttendance:
				stats.church.newMembersPresence / totalSundays,
			averageOldMembersAttendance:
				stats.church.oldMembersPresence / totalSundays,
			averageGeneralAbsence: stats.church.totalAbsence / totalSundays,
			averageNewMembersAbsence: stats.church.newMembersAbsence / totalSundays,
			averageOldMembersAbsence: stats.church.oldMembersAbsence / totalSundays,
		},
		service: {
			averageGeneralAttendance: stats.service.totalPresence / totalSundays,
			averageNewMembersAttendance:
				stats.service.newMembersPresence / totalSundays,
			averageOldMembersAttendance:
				stats.service.oldMembersPresence / totalSundays,
			averageGeneralAbsence: stats.service.totalAbsence / totalSundays,
			averageNewMembersAbsence: stats.service.newMembersAbsence / totalSundays,
			averageOldMembersAbsence: stats.service.oldMembersAbsence / totalSundays,
		},
		reunion: {
			averageGeneralAttendance: stats.meeting.totalPresence / totalSundays,
			averageNewMembersAttendance:
				stats.meeting.newMembersPresence / totalSundays,
			averageOldMembersAttendance:
				stats.meeting.oldMembersPresence / totalSundays,
			averageGeneralAbsence: stats.meeting.totalAbsence / totalSundays,
			averageNewMembersAbsence: stats.meeting.newMembersAbsence / totalSundays,
			averageOldMembersAbsence: stats.meeting.oldMembersAbsence / totalSundays,
		},
	}
}

export interface Attendance {
	id: string
	memberId: string
	date: Date | string
	inChurch: boolean | null
	inService: boolean | null
	inMeeting: boolean | null
}

export interface AttendanceReport {
	id: string
	entity: EntityType
	comment: string | null
	createdAt: Date | string
	departmentId: string | null
	tribeId: string | null
	honorFamilyId: string | null
	submitterId: string
	attendances: Attendance[]
}

export interface AttendanceStats {
	culte: CategoryStats
	service: CategoryStats
	reunion: CategoryStats
}

export interface CategoryStats {
	averageGeneralAttendance: number
	averageNewMembersAttendance: number
	averageOldMembersAttendance: number
	averageGeneralAbsence: number
	averageNewMembersAbsence: number
	averageOldMembersAbsence: number
}
