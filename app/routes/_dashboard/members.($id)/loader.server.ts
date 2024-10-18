import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { getMonthSundays, normalizeDate } from '~/utils/date'
import { prisma } from '~/utils/db.server'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { type User, type Prisma } from '@prisma/client'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { filterSchema } from './schema'
import { MemberStatus } from '~/shared/enum'
import { type MemberFilterOptions } from './types'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const { value } = submission

	const where = getFilterOptions(formatOptions(value), currentUser)

	const members = (await prisma.user.findMany({
		where,
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			createdAt: true,
		},
		orderBy: { createdAt: 'desc' },
		take: value.page * value.take,
	})) as Member[]

	const total = await prisma.user.count({ where })

	return json({
		total,
		members: getMembersAttendances(members),
		filterData: value,
	})
}

export type LoaderType = typeof loaderFn

function getMembersAttendances(members: Member[]): MemberMonthlyAttendances[] {
	const currentMonthSundays = getMonthSundays(new Date())
	return members.map(member => ({
		...member,
		previousMonthAttendanceResume: null,
		currentMonthAttendanceResume: null,
		currentMonthAttendances: currentMonthSundays.map(sunday => ({
			sunday,
			isPresent: null,
		})),
	}))
}

function getFilterOptions(
	params: MemberFilterOptions,
	currentUser: User,
): Prisma.UserWhereInput {
	const { tribeId, departmentId, honorFamilyId } = params

	const contains = `%${params.query.replace(/ /g, '%')}%`

	return {
		id: { not: currentUser.id },
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
		churchId: currentUser.churchId,
		roles: { hasSome: ['ADMIN', 'MEMBER'] },
		...(tribeId && { tribeId }),
		...(departmentId && { departmentId }),
		...(honorFamilyId && { honorFamilyId }),
		...getDateFilterOptions(params),
	}
}

function getDateFilterOptions(options: MemberFilterOptions) {
	const { status, to, from } = options

	const isAll = status?.toLocaleLowerCase() === 'all'
	const statusEnabled = !!status && !isAll
	const isNew = status === MemberStatus.NEW

	const startDate = normalizeDate(new Date(from), 'start')
	const endDate = normalizeDate(new Date(to), 'end')

	return {
		...(!statusEnabled && { createdAt: { lte: endDate } }),
		...(statusEnabled
			? {
					createdAt: isNew
						? { gte: startDate, lte: endDate }
						: { lte: startDate },
				}
			: { createdAt: { lte: endDate } }),
	}
}

function formatOptions(options: MemberFilterOptions) {
	let filterOptions: any = {}

	for (const [key, value] of Object.entries(options)) {
		filterOptions[key] = value.toLocaleString() === 'all' ? undefined : value
	}

	return filterOptions
}
