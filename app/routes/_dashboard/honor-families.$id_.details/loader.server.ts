import {
	buildUserWhereInput,
	formatAsSelectFieldsData,
	getHonorFamily,
	getHonorFamilyAssistants,
	getUrlParams,
} from './utils/utils.server'
import invariant from 'tiny-invariant'
import { prisma } from '~/utils/db.server'
import { requireUser } from '~/utils/auth.server'
import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import {
	fetchAttendanceData,
	getMemberQuery,
	prepareDateRanges,
} from '~/utils/attendance.server'
import { parseISO } from 'date-fns'
import { getMembersAttendances } from '~/shared/attendance'
import type { Member } from '~/models/member.model'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	invariant(currentUser.churchId, 'User Church ID is required')

	const { id } = params
	invariant(id, 'honor family ID is required')

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

	const where = buildUserWhereInput({ id, filterData })

	const memberQuery = getMemberQuery(where, filterData)

	const [total, membersStats, honorFamily] = await Promise.all([
		memberQuery[0],
		memberQuery[1],
		getHonorFamily(id),
	])

	const members = membersStats as Member[]
	const memberIds = members.map(m => m.id)

	if (!honorFamily) return redirect('/honor-families')

	currentUser.honorFamilyId = id

	const membersWithoutAssistants = await prisma.user.findMany({
		where: {
			churchId: currentUser.churchId,
			honorFamilyId: id,
			isActive: true,
		},
		select: { id: true, name: true, phone: true, isAdmin: true },
		orderBy: { name: 'asc' },
	})

	const assistants = await getHonorFamilyAssistants({
		id,
		churchId: currentUser.churchId,
		managerId: honorFamily.manager.id,
	})

	const { allAttendances, previousAttendances } = await fetchAttendanceData(
		currentUser,
		memberIds,
		fromDate,
		processedToDate,
		previousFrom,
		previousTo,
	)

	return json({
		honorFamily: {
			...honorFamily,
			total: total as number,
			members: getMembersAttendances(
				members,
				currentMonthSundays,
				previousMonthSundays,
				allAttendances,
				previousAttendances,
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
