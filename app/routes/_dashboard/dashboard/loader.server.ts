import { parseWithZod } from '@conform-to/zod'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { requireUser } from '~/utils/auth.server'
import { getMonthSundays } from '~/utils/date'
import { prisma } from '~/utils/db.server'
import { filterSchema } from './schema'
import invariant from 'tiny-invariant'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const user = await requireUser(request)

	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	// const { value } = submission

	const { roles } = user

	const isChurchAdmin = roles.includes('ADMIN')
	let members: Member[] = []

	if (isChurchAdmin) {
		members = (await prisma.user.findMany({
			select: {
				id: true,
				name: true,
				phone: true,
				location: true,
				integrationDate: true,
				createdAt: true,
			},
			orderBy: { createdAt: 'desc' },
		})) as Member[]
	} else {
		const entityConditions = []

		if (user.tribeId) {
			entityConditions.push({ tribe: { managerId: user.id } })
		}
		if (user.departmentId) {
			entityConditions.push({ department: { managerId: user.id } })
		}
		if (user.honorFamilyId) {
			entityConditions.push({ honorFamily: { managerId: user.id } })
		}

		if (entityConditions.length > 0) {
			members = (await prisma.user.findMany({
				where: { OR: entityConditions },
				select: {
					id: true,
					name: true,
					phone: true,
					location: true,
					integrationDate: true,
					createdAt: true,
				},
				orderBy: { createdAt: 'desc' },
			})) as Member[]
		}
	}

	const membersWithAttendances = getMembersAttendances(members)

	return json({ user, members: membersWithAttendances, isChurchAdmin })
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
