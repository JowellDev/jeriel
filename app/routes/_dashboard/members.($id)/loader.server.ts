import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { getcurrentMonthSundays } from '~/utils/date'
import { prisma } from '~/utils/db.server'
import { z } from 'zod'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { type User, type Prisma } from '@prisma/client'
import type {
	Member,
	MemberWithMonthlyAttendances,
} from '~/models/member.model'

const paramsSchema = z.object({
	take: z.number().default(15),
	page: z.number().default(1),
	tribeId: z.string().optional(),
	departmentId: z.string().optional(),
	honorFamilyId: z.string().optional(),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: paramsSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const { value } = submission

	const members = await getMembers(value, currentUser)

	return json({ data: getMembersAttendances(members) })
}

async function getMembers(
	filterParams: z.infer<typeof paramsSchema>,
	currentUser: User,
): Promise<Member[]> {
	const where = getFilterOptions(filterParams)
	return (await prisma.user.findMany({
		where: {
			...where,
			churchId: currentUser.churchId,
			roles: { hasSome: ['ADMIN', 'MEMBER'] },
			id: { not: currentUser.id },
		},
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			createdAt: true,
		},
		orderBy: { createdAt: 'desc' },
		take: filterParams.page * filterParams.take,
	})) as Member[]
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
): Prisma.UserWhereInput {
	const contains = `%${params.query.replace(/ /g, '%')}%`

	return {
		tribeId: params.tribeId,
		departmentId: params.departmentId,
		honorFamilyId: params.honorFamilyId,
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
	}
}
