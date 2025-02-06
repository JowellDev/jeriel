import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { filterSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { getMonthSundays, normalizeDate } from '~/utils/date'
import { MemberStatus } from '~/shared/enum'
import { type Prisma, type User } from '@prisma/client'
import { prisma } from '~/utils/db.server'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import type { MemberFilterOptions } from './types'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const { value } = submission

	const where = getFilterOptions(formatOptions(value), currentUser)

	const [total, members, services] = await Promise.all([
		prisma.user.count({ where }),
		prisma.user.findMany({
			where,
			select: {
				id: true,
				name: true,
				phone: true,
				location: true,
				createdAt: true,
				integrationDate: true,
			},
			orderBy: { createdAt: 'desc' },
			take: value.page * value.take,
		}),

		prisma.service.findMany({
			where: { tribeId: currentUser.tribeId },
			select: {
				from: true,
				to: true,
			},
		}),
	])

	return json({
		total,
		members: getMembersAttendances(members),
		filterData: value,
		tribeId: currentUser.tribeId ?? '',
		services,
	} as const)
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
	const contains = `%${params.query.replace(/ /g, '%')}%`

	return {
		id: { not: currentUser.id },
		churchId: currentUser.churchId,
		tribeId: currentUser.tribeId,
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
		...getDateFilterOptions(params),
	}
}

function getDateFilterOptions(options: MemberFilterOptions) {
	const { status, to, from } = options

	const isAll = status === 'ALL'
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
	const filterOptions: any = {}

	for (const [key, value] of Object.entries(options)) {
		filterOptions[key] = value.toLocaleString() === 'ALL' ? undefined : value
	}

	return filterOptions
}
