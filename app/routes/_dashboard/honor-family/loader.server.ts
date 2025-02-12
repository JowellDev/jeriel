import { Role } from '@prisma/client'
import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireRole } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { parseISO } from 'date-fns'
import {
	getUrlParams,
	getHonorFamily,
	getHonorFamilyMembers,
	formatAsSelectFieldsData,
	getHonorFamilyAssistants,
} from './utils/utils.server'
import {
	prepareDateRanges,
	fetchAttendanceData,
} from '~/utils/attendance.server'
import { getMembersAttendances } from '~/shared/attendance'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const user = await requireRole(request, [Role.HONOR_FAMILY_MANAGER])
	const { churchId, honorFamilyId: id } = user

	invariant(churchId, 'Church ID is required')
	invariant(id, 'Honor Family ID is required')

	const filterData = getUrlParams(request)
	const fromDate = parseISO(filterData.from)
	const toDate = parseISO(filterData.to)

	const {
		toDate: processedToDate,
		currentMonthSundays,
		previousMonthSundays,
		previousFrom,
		previousTo,
	} = prepareDateRanges(toDate)

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

	const memberIds = members.map(m => m.id)
	const { allAttendances, previousAttendances } = await fetchAttendanceData(
		user,
		memberIds,
		fromDate,
		processedToDate,
		previousFrom,
		previousTo,
	)

	return json({
		honorFamily: {
			...honorFamily,
			total: count,
			members: getMembersAttendances(
				members,
				allAttendances,
				previousAttendances,
				currentMonthSundays,
				previousMonthSundays,
			),
			assistants,
			membersWithoutAssistants: formatAsSelectFieldsData(
				membersWithoutAssistants,
			),
		},
		filterData,
	})
}

export type LoaderData = typeof loaderFn
