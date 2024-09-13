import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { getMonthSundays, normalizeDate } from '~/utils/date'
import { prisma } from '~/utils/db.server'
import { type z } from 'zod'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { type User, type Prisma } from '@prisma/client'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { paramsSchema } from './schema'
import { SELECT_ALL_OPTION } from '~/shared/constants'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: paramsSchema,
	})

	console.log('submission =========>', submission)

	invariant(submission.status === 'success', 'params must be defined')

	const { value } = submission

	const where = getFilterOptions(value, currentUser)

	console.log('where =========>', where)

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
	currentUser: User,
): Prisma.UserWhereInput {
	const { tribeId, departmentId, honorFamilyId, from, to } = params
	const contains = `%${params.query.replace(/ /g, '%')}%`
	const isPeriodDefined = from && to

	const hasDepartmentId =
		!!departmentId && departmentId !== SELECT_ALL_OPTION.value
	const hasHonorFamilyId =
		!!honorFamilyId && honorFamilyId !== SELECT_ALL_OPTION.value
	const hasTribeId = !!tribeId && tribeId !== SELECT_ALL_OPTION.value

	return {
		...(hasTribeId && { tribeId }),
		...(hasDepartmentId && { departmentId }),
		...(hasHonorFamilyId && { honorFamilyId }),

		id: { not: currentUser.id },
		churchId: currentUser.churchId,
		roles: { hasSome: ['ADMIN', 'MEMBER'] },
		...(isPeriodDefined && {
			createdAt: {
				gte: normalizeDate(new Date(from)),
				lt: normalizeDate(new Date(to), 'end'),
			},
		}),
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
	}
}
