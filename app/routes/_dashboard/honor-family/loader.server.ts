import { Role } from '@prisma/client'
import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireRole } from '~/utils/auth.server'
import { getMonthSundays } from '~/utils/date'
import { prisma } from '~/utils/db.server'
import {
	getUrlParams,
	getHonorFamily,
	getHonorFamilyMembers,
	formatAsSelectFieldsData,
	getHonorFamilyAssistants,
} from './utils/utils.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const { churchId, honorFamilyId: id } = await requireRole(request, [
		Role.HONOR_FAMILY_MANAGER,
	])

	invariant(churchId, 'Church ID is required')
	invariant(id, 'Department ID is required')

	const filterData = getUrlParams(request)

	const honorFamily = await getHonorFamily(id)

	if (!honorFamily) return redirect('/dashboard')

	const { members, count } = await getHonorFamilyMembers({ id, filterData })

	const assistants = await getHonorFamilyAssistants({
		id,
		churchId,
		managerId: honorFamily.manager.id,
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
