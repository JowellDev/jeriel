import { parseWithZod } from '@conform-to/zod'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireRole } from '~/utils/auth.server'
import { schema } from './schema'
import { prisma } from '~/utils/db.server'
import { AttendanceReportEntity } from '@prisma/client'
import invariant from 'tiny-invariant'

export async function loader({ request }: LoaderFunctionArgs) {
	const currentUser = await requireRole(request, ['ADMIN'])
	const url = new URL(request.url)

	const submission = parseWithZod(url.searchParams, { schema })

	invariant(currentUser.churchId, 'ChurchId must be defined')

	if (submission.status != 'success') return

	const { entity, firstDateFrom, firstDateTo, secondDateFrom, secondDateTo } =
		submission.value

	const [firstPeriodAttendances, secondPeriodAttendances] = await Promise.all([
		fetchAttendanceReports(
			entity,
			new Date(firstDateFrom),
			new Date(firstDateTo),
			currentUser.churchId,
		),
		fetchAttendanceReports(
			entity,
			new Date(secondDateFrom),
			new Date(secondDateTo),
			currentUser.churchId,
		),
	])

	return {
		firstPeriodAttendances,
		secondPeriodAttendances,
	}
}

function fetchAttendanceReports(
	entity: 'CULTE' | 'DEPARTMENT' | 'TRIBE' | 'HONOR_FAMILY',
	fromDate: Date,
	toDate: Date,
	churchId: string,
) {
	if (entity === 'CULTE') {
		return prisma.attendanceReport.findMany({
			where: {
				attendances: {
					every: {
						date: {
							gte: fromDate,
							lte: toDate,
						},
					},
				},
				submitter: {
					churchId,
				},
				entity: {
					not: AttendanceReportEntity.HONOR_FAMILY,
				},
			},
			include: {
				attendances: {
					select: {
						member: {
							select: {
								id: true,
								createdAt: true,
							},
						},
						inChurch: true,
					},
				},
			},
		})
	}

	const entityMapping = {
		DEPARTMENT: AttendanceReportEntity.DEPARTMENT,
		TRIBE: AttendanceReportEntity.TRIBE,
		HONOR_FAMILY: AttendanceReportEntity.HONOR_FAMILY,
	}

	return prisma.attendanceReport.findMany({
		where: {
			submitter: {
				churchId,
			},
			entity: entityMapping[entity],
			attendances: {
				every: {
					date: {
						gte: fromDate,
						lte: toDate,
					},
				},
			},
		},
		include: {
			attendances: {
				select: {
					member: {
						select: {
							id: true,
							createdAt: true,
						},
					},
					...(entity === 'HONOR_FAMILY'
						? { inMeeting: true }
						: { inService: true }),
				},
			},
		},
	})
}
