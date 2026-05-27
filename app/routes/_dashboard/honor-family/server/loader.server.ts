import { Role } from '@prisma/client'
import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireRole } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import { parseISO } from 'date-fns'
import {
	getUrlParams,
	getHonorFamily,
	getHonorFamilyMembers,
	formatAsSelectFieldsData,
	getHonorFamilyAssistants,
} from '../utils/utils.server'
import {
	prepareDateRanges,
	fetchAttendanceData,
	fetchAllEntityMembers,
} from '~/helpers/attendance.server'
import { getMembersAttendances } from '~/shared/attendance'

function parseLoaderDates(filterData: ReturnType<typeof getUrlParams>) {
	const fromDate = parseISO(filterData.from)
	const toDate = parseISO(filterData.to)
	return { fromDate, dateRanges: prepareDateRanges(toDate) }
}

function getMembersWithoutAssistants(id: string, churchId: string) {
	return prisma.user.findMany({
		where: { churchId, honorFamilyId: id, isActive: true },
		select: { id: true, name: true, phone: true, isAdmin: true },
		orderBy: { name: 'asc' },
	})
}

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const user = await requireRole(request, [Role.HONOR_FAMILY_MANAGER])
	const { churchId, honorFamilyId: id } = user
	invariant(churchId, 'Church ID is required')
	invariant(id, 'Honor Family ID is required')
	user.tribeId = null
	user.departmentId = null

	const filterData = getUrlParams(request)
	const { fromDate, dateRanges } = parseLoaderDates(filterData)

	const [honorFamily, { members, count }, membersWithoutAssistants] =
		await Promise.all([
			getHonorFamily(id),
			getHonorFamilyMembers({ id, filterData }),
			getMembersWithoutAssistants(id, churchId),
		])

	if (!honorFamily) return redirect('/dashboard')

	const [assistants, allMembers, { allAttendances, previousAttendances }] =
		await Promise.all([
			getHonorFamilyAssistants({
				id,
				churchId,
				managerId: honorFamily.manager?.id ?? 'N/D',
			}),
			fetchAllEntityMembers(user),
			fetchAttendanceData(
				user,
				members.map(m => m.id),
				fromDate,
				dateRanges.toDate,
				dateRanges.previousFrom,
				dateRanges.previousTo,
			),
		])

	return {
		honorFamily: {
			...honorFamily,
			total: count,
			members: getMembersAttendances(
				members,
				dateRanges.currentMonthSundays,
				dateRanges.previousMonthSundays,
				allAttendances,
				previousAttendances,
			),
			assistants,
			membersWithoutAssistants: formatAsSelectFieldsData(
				membersWithoutAssistants,
			),
			allMembers,
		},
		filterData,
	}
}

export type LoaderData = typeof loaderFn
