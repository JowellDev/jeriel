import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { prisma } from '~/utils/db.server'
import { getMonthSundays, normalizeDate } from '~/utils/date'
import type { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { Role, type Prisma } from '@prisma/client'
import type { Department } from './models'
import { paramsSchema } from './schema'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	await requireUser(request)
	const { id } = params

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: paramsSchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const { value } = submission

	const department = await prisma.department.findUnique({
		where: { id: id },
		select: {
			id: true,
			name: true,
			manager: {
				select: {
					id: true,
					name: true,
					phone: true,
					location: true,
					createdAt: true,
				},
			},
			createdAt: true,
		},
	})

	if (!department) {
		throw new Response('Not Found', { status: 404 })
	}

	const where = getFilterOptions(value, department)

	const members = await prisma.user.findMany({
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
	})

	const assistants = await prisma.user.findMany({
		where: {
			departmentId: department.id,
			id: { not: department.manager.id },
			roles: { has: Role.DEPARTMENT_MANAGER },
		},
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			createdAt: true,
		},
	})

	const total = await prisma.user.count({
		where,
	})

	return json({
		department: {
			id: department.id,
			name: department.name,
			manager: department.manager,
			createdAt: department.createdAt,
		},
		total,
		assistants,
		members: getMembersAttendances(members),
		filterData: value,
	})
}

export type LoaderData = typeof loaderFn

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
	params: z.infer<typeof paramsSchema>,
	department: Department,
): Prisma.UserWhereInput {
	const { from, to } = params

	const contains = `%${params.query.replace(/ /g, '%')}%`
	const isPeriodDefined = from && to

	return {
		departmentId: department.id,
		...(isPeriodDefined && {
			createdAt: {
				gte: normalizeDate(new Date(from)),
				lt: normalizeDate(new Date(to), 'end'),
			},
		}),
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
	}
}
