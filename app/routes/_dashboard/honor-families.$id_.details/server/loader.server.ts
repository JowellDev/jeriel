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
	buildMembersWithAttendances,
	getMemberQuery,
	parseExportDateRanges,
} from '~/helpers/attendance.server'
import type { Member } from '~/models/member.model'

function parseLoaderDates(request: Request) {
	const filterData = getUrlParams(request)
	const { fromDate, dateRanges } = parseExportDateRanges(filterData)
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
	const [assistants, membersWithAttendances] = await Promise.all([
		getHonorFamilyAssistants({ id, churchId: currentUser.churchId, managerId: honorFamily.manager?.id ?? 'N/D' }),
		buildMembersWithAttendances(currentUser, members, fromDate, dateRanges),
	])
	return {
		honorFamily: {
			...honorFamily,
			total: total as number,
			members: membersWithAttendances,
			assistants,
			membersWithoutAssistants: formatAsSelectFieldsData(membersWithoutAssistants),
		},
		filterData,
	}
}

export type LoaderData = typeof loaderFn
