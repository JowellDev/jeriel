import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { filterSchema, type MemberFilterOptions } from './schema'
import type { Prisma } from '@prisma/client'
import { prisma } from '~/utils/db.server'
import { requireUser } from '~/utils/auth.server'
import { normalizeDate } from '~/utils/date'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	invariant(currentUser.churchId, 'Church ID is required')

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: filterSchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const filterData = submission.value

	const where = getFilterOptions(submission.value)

	const attendanceReports = await prisma.attendanceReport.findMany({
		where,
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

	const total = await prisma.attendanceReport.count({ where })

	return json({
		attendanceReports,
		filterData,
		total,
	} as const)
}

export type LoaderType = typeof loaderFn

function getFilterOptions(
	filterOptions: MemberFilterOptions,
): Prisma.AttendanceReportWhereInput {
	const params = formatOptions(filterOptions)
	const { tribeId, departmentId, honorFamilyId } = params

	const { to, from, entityType } = filterOptions
	let startDate: Date | undefined

	from === 'null'
		? (startDate = undefined)
		: (startDate = normalizeDate(new Date(from), 'start'))

	const endDate = normalizeDate(new Date(to), 'end')

	const contains = `%${filterOptions.query.replace(/ /g, '%')}%`

	const createSearchCondition = (fieldName: string) => ({
		[fieldName]: {
			name: { contains, mode: 'insensitive' },
			manager: { name: { contains, mode: 'insensitive' } },
		},
	})

	const entityFilter =
		entityType === 'ALL'
			? {}
			: entityType === 'TRIBE'
				? {
						tribeId: tribeId || undefined,
						departmentId: null,
						honorFamilyId: null,
					}
				: entityType === 'DEPARTMENT'
					? {
							departmentId: departmentId || undefined,
							tribeId: null,
							honorFamilyId: null,
						}
					: entityType === 'HONOR_FAMILY'
						? {
								honorFamilyId: honorFamilyId || undefined,
								tribeId: null,
								departmentId: null,
							}
						: {}

	return {
		...(entityType && entityFilter),
		...(entityType === 'TRIBE' && tribeId && { tribeId }),
		...(entityType === 'DEPARTMENT' && departmentId && { departmentId }),
		...(entityType === 'HONOR_FAMILY' && honorFamilyId && { honorFamilyId }),
		OR: [
			createSearchCondition('tribe'),
			createSearchCondition('honorFamily'),
			createSearchCondition('department'),
		],
		...(tribeId && { tribeId }),
		...(departmentId && { departmentId }),
		...(honorFamilyId && { honorFamilyId }),
		createdAt: { gte: startDate, lte: endDate },
	}
}

function formatOptions(options: MemberFilterOptions) {
	const filterOptions: any = {}

	for (const [key, value] of Object.entries(options)) {
		filterOptions[key] = value.toLocaleString() === 'ALL' ? undefined : value
	}

	return filterOptions
}
