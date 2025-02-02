import {
	formatAsSelectFieldsData,
	getHonorFamily,
	getHonorFamilyAssistants,
	getHonorFamilyMembers,
	getUrlParams,
} from './utils/utils.server'
import invariant from 'tiny-invariant'
import { prisma } from '~/utils/db.server'
import { requireUser } from '~/utils/auth.server'
import { getMonthSundays } from '~/utils/date'
import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	const { churchId } = await requireUser(request)
	invariant(churchId, 'User Church ID is required')

	const { id } = params
	invariant(id, 'honor family ID is required')

	const filterData = getUrlParams(request)

	const honorFamily = await getHonorFamily(id)

	if (!honorFamily) return redirect('/honor-families')

	const { members, count } = await getHonorFamilyMembers({
		honorFamilyId: id,
		filterData,
	})

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

	const membersWithAttendances = members.map(member => ({
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
			total: count,
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
