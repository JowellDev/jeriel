import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { prisma } from '~/utils/db.server'
import { getMonthSundays, normalizeDate } from '~/utils/date'
import type { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { Role, type Prisma } from '@prisma/client'
import { paramsSchema } from './schema'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	await requireUser(request)
	const { id: departmentId } = params

	invariant(departmentId, 'Department ID is required')

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: paramsSchema })

	if (submission.status !== 'success') {
		throw new Error('Invalid search criteria')
	}

	const { value } = submission

	const filterOptions = getFilterOptions(value, departmentId)

	const [department, total, assistants, members] = await Promise.all([
		getDepartment(departmentId),
		getTotalMembersCount(filterOptions.where),
		getAssistants(departmentId),
		getMembers(filterOptions),
	])

	if (!department) {
		throw new Response('Department Not Found', { status: 404 })
	}

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

async function getDepartment(id: string) {
	return prisma.department.findUnique({
		where: { id },
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
}

async function getTotalMembersCount(where: Prisma.UserWhereInput) {
	return prisma.user.count({ where })
}

async function getAssistants(departmentId: string) {
	return prisma.user.findMany({
		where: {
			departmentId,
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
}

async function getMembers(filterOptions: ReturnType<typeof getFilterOptions>) {
	const { where, take } = filterOptions
	return prisma.user.findMany({
		where,
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			createdAt: true,
		},
		orderBy: { createdAt: 'desc' },
		take,
	})
}

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
	departmentId: string,
): { where: Prisma.UserWhereInput; take: number } {
	const { from, to, query, page, take } = params

	const contains = `%${query.replace(/ /g, '%')}%`
	const isPeriodDefined = from && to

	const where: Prisma.UserWhereInput = {
		departmentId,
		...(isPeriodDefined && {
			createdAt: {
				gte: normalizeDate(new Date(from)),
				lt: normalizeDate(new Date(to), 'end'),
			},
		}),
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
	}

	return { where, take: page * take }
}

export type LoaderType = typeof loaderFn
