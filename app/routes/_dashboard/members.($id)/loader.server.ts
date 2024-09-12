import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { getcurrentMonthSundays } from '~/utils/date'
import { prisma } from '~/utils/db.server'
import { type z } from 'zod'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { type User, type Prisma } from '@prisma/client'
import type {
	Member,
	MemberWithMonthlyAttendances,
} from '~/models/member.model'
import { paramsSchema } from './schema'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: paramsSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const { value } = submission

	const where = getFilterOptions(value, currentUser)

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
function getMembersAttendances(
	members: Member[],
): MemberWithMonthlyAttendances[] {
	const currentMonthSundays = getcurrentMonthSundays()
	return members.map(member => ({
		...member,
		lastMonthAttendanceResume: null,
		currentMonthAttendanceResume: null,
		currentMonthAttendances: currentMonthSundays.map(sunday => ({
			sunday,
			isPresent: null,
		})),
	}))
}

function getFilterOptions(
	params: z.infer<typeof paramsSchema>,
	currentUser: User,
): Prisma.UserWhereInput {
	const contains = `%${params.query.replace(/ /g, '%')}%`

	return {
		id: { not: currentUser.id },
		churchId: currentUser.churchId,
		tribeId: params.tribeId,
		departmentId: params.departmentId,
		honorFamilyId: params.honorFamilyId,
		roles: { hasSome: ['ADMIN', 'MEMBER'] },
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
	}
}
