import {
	buildUserWhereInput,
	formatAsSelectFieldsData,
	getHonorFamily,
	getHonorFamilyAssistants,
	getUrlParams,
} from '../utils/utils.server'
import invariant from 'tiny-invariant'
import { prisma } from '~/infrastructures/database/prisma.server'
import { requireUser } from '~/utils/auth.server'
import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import {
	fetchAttendanceData,
	getMemberQuery,
	prepareDateRanges,
} from '~/helpers/attendance.server'
import { parseISO } from 'date-fns'
import { getMembersAttendances } from '~/shared/attendance'
import type { Member } from '~/models/member.model'

function parseLoaderDates(request: Request) {
	const filterData = getUrlParams(request)
	const fromDate = parseISO(filterData.from)
	const toDate = parseISO(filterData.to)
	const dateRanges = prepareDateRanges(toDate)
	return { filterData, fromDate, dateRanges }
}

async function fetchMembersWithoutAssistants(
	honorFamilyId: string,
	churchId: string,
) {
	return prisma.user.findMany({
		where: { churchId, honorFamilyId, isActive: true },
		select: { id: true, name: true, phone: true, isAdmin: true },
		orderBy: { name: 'asc' },
	})
}

async function fetchBaseHonorFamilyData(
	id: string,
	churchId: string,
	filterData: any,
) {
	const where = buildUserWhereInput({ id, filterData })
	const memberQuery = getMemberQuery(where, filterData)
	const [total, membersStats, honorFamily, membersWithoutAssistants] =
		await Promise.all([
			memberQuery[0],
			memberQuery[1],
			getHonorFamily(id),
			fetchMembersWithoutAssistants(id, churchId),
		])
	return { total, membersStats, honorFamily, membersWithoutAssistants }
}

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	invariant(currentUser.churchId, 'User Church ID is required')

	const { id } = params
	invariant(id, 'honor family ID is required')

	const { filterData, fromDate, dateRanges } = parseLoaderDates(request)
	const { total, membersStats, honorFamily, membersWithoutAssistants } =
		await fetchBaseHonorFamilyData(id, currentUser.churchId, filterData)

	if (!honorFamily) return redirect('/honor-families')

	currentUser.honorFamilyId = id
	const members = membersStats as Member[]

	const [assistants, { allAttendances, previousAttendances }] =
		await Promise.all([
			getHonorFamilyAssistants({
				id,
				churchId: currentUser.churchId,
				managerId: honorFamily.manager?.id ?? 'N/D',
			}),
			fetchAttendanceData(
				currentUser,
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
			total: total as number,
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
		},
		filterData,
	}
}

export type LoaderData = typeof loaderFn
