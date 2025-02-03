import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { querySchema } from './schema'
import type { Prisma } from '@prisma/client'
import { prisma } from '~/utils/db.server'
import { requireUser } from '~/utils/auth.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	invariant(currentUser.churchId, 'Church ID is required')

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const filterData = submission.value

	const contains = `%${filterData.query.replace(/ /g, '%')}%`

	const commonWhere = {
		OR: [
			{
				tribe: {
					name: { contains, mode: 'insensitive' },
					manager: { name: { contains, mode: 'insensitive' } },
				},
			},
			{
				honorFamily: {
					name: { contains, mode: 'insensitive' },
					manager: { name: { contains, mode: 'insensitive' } },
				},
			},
			{
				department: {
					name: { contains, mode: 'insensitive' },
					manager: { name: { contains, mode: 'insensitive' } },
				},
			},
		],
	} satisfies Prisma.AttendanceReportWhereInput

	const attendanceReports = await prisma.attendanceReport.findMany({
		where: { ...commonWhere },
		include: {
			tribe: {
				select: {
					manager: { select: { name: true, phone: true } },
					name: true,
				},
			},
			department: {
				select: {
					manager: { select: { name: true, phone: true } },
					name: true,
				},
			},
			honorFamily: {
				select: {
					manager: { select: { name: true, phone: true } },
					name: true,
				},
			},
			attendances: {
				select: {
					member: { select: { name: true } },
					inChurch: true,
					inService: true,
					memberId: true,
				},
			},
		},
	})

	const total = await prisma.attendanceReport.count({ where: commonWhere })

	return json({
		attendanceReports,
		filterData,
		total,
	} as const)
}

export type LoaderType = typeof loaderFn
