import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import { requireUser } from '~/utils/auth.server'
import { getMonthSundays } from '~/utils/date'
import { prisma } from '~/utils/db.server'
import { paramsSchema } from './schema'
import invariant from 'tiny-invariant'
import { Role, type Prisma } from '@prisma/client'
import {
	formatAsSelectFieldsData,
	getHonorFamilyAndMembers,
	getHonorFamilyAssistants,
} from './utils/utils.server'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	const { churchId } = await requireUser(request)
	invariant(churchId, 'Church ID is required')

	const { id } = params
	invariant(id, 'honor family ID is required')

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: paramsSchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const { value: filterData } = submission

	const contains = `%${filterData.query.replace(/ /g, '%')}%`

	const where = {
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
	} satisfies Prisma.UserWhereInput

	const honorFamily = await getHonorFamilyAndMembers({
		id,
		where,
		take: filterData.take,
	})

	if (!honorFamily) return redirect('/honor-families')

	const assistants = await getHonorFamilyAssistants({
		churchId,
		honorFamilyId: id,
		honorFamilyManagerId: honorFamily.manager.id,
	})

	const membersWithoutAssistants = await prisma.user.findMany({
		where: {
			churchId,
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
