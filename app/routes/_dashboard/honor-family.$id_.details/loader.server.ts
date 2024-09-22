import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import { requireUser } from '~/utils/auth.server'
import { getMonthSundays } from '~/utils/date'
import { prisma } from '~/utils/db.server'
import { paramsSchema } from './schema'
import invariant from 'tiny-invariant'
import { Role, type Prisma } from '@prisma/client'
import { formatAsSelectFieldsData } from './utils/utils.server'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	await requireUser(request)

	const { id } = params

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: paramsSchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const { value: filterData } = submission

	const contains = `%${filterData.query.replace(/ /g, '%')}%`

	const where = {
		OR: [{ isActive: true, name: { contains }, phone: { contains } }],
	} satisfies Prisma.UserWhereInput

	const honorFamily = await prisma.honorFamily.findUnique({
		where: { id: id },
		select: {
			id: true,
			name: true,
			_count: { select: { members: true } },
			manager: { select: { id: true, name: true } },
			members: {
				where,
				select: {
					id: true,
					name: true,
					phone: true,
					isAdmin: true,
					createdAt: true,
				},
				take: filterData.take,
				orderBy: { name: 'asc' },
			},
		},
	})

	if (!honorFamily) {
		return redirect('/honor-families')
	}

	const assistants = await prisma.user.findMany({
		where: {
			isActive: true,
			honorFamilyId: id,
			id: { not: honorFamily.manager.id },
			roles: { has: Role.HONOR_FAMILY_MANAGER },
		},
		select: { id: true, name: true, phone: true, isAdmin: true },
		orderBy: { name: 'asc' },
	})

	const membersWithoutAssistants = await prisma.user.findMany({
		where: {
			id: { not: { in: assistants.map(a => a.id) } },
			honorFamilyId: id,
			isActive: true,
		},
		select: { id: true, name: true, phone: true, isAdmin: true },
		orderBy: { name: 'asc' },
	})

	const currentMonthSundays = getMonthSundays(new Date())

	const membersWithAttendances = honorFamily.members.map(member => ({
		...member,
		lastMonthAttendanceResume: null,
		currentMonthAttendanceResume: null,
		currentMonthAttendances: currentMonthSundays.map((sunday: any) => ({
			sunday,
			isPresent: null,
		})),
	}))

	return json({
		honorFamily: {
			...honorFamily,
			members: membersWithAttendances,
			assistants,
			membersWithoutAssistants: formatAsSelectFieldsData(
				membersWithoutAssistants,
			),
		},
		filterData,
	})
}

export type LoaderData = typeof loaderFn
