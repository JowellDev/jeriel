import { type ActionFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import { type Prisma } from '@prisma/client'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import { normalizeDate } from '~/utils/date'
import { MemberStatus } from '~/shared/enum'
import {
	buildMembersWithAttendances,
	parseExportDateRanges,
} from '~/helpers/attendance.server'
import { createMembersExcelFile } from '~/utils/excel.server'
import type { Member } from '~/models/member.model'
import { FORM_INTENT } from '../constants'
import { paramsSchema } from '../schema'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const { departmentId, churchId } = currentUser

	invariant(churchId, 'Invalid churchId')
	invariant(departmentId, 'departmentId is required')

	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === FORM_INTENT.EXPORT) {
		return exportMembers(request, currentUser, departmentId)
	}

	return { status: 'success' }
}

export type ActionType = typeof actionFn

function getUrlParams(request: Request) {
	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: paramsSchema })
	invariant(submission.status === 'success', 'invalid criteria')

	return submission.value
}

async function getDepartmentName(id: string) {
	return prisma.department.findFirst({
		where: { id },
		select: { name: true },
	})
}

async function getExportDepartmentMembers(
	departmentId: string,
	filterData: ReturnType<typeof getUrlParams>,
): Promise<Member[]> {
	const contains = `%${filterData.query.replace(/ /g, '%')}%`

	return prisma.user.findMany({
		where: buildExportWhereInput(departmentId, filterData, contains),
		select: {
			id: true,
			integrationDate: true,
			name: true,
			email: true,
			phone: true,
			location: true,
			createdAt: true,
			birthday: true,
			gender: true,
			maritalStatus: true,
			pictureUrl: true,
		},
		orderBy: { name: 'asc' },
	})
}

function buildExportWhereInput(
	departmentId: string,
	filterData: ReturnType<typeof getUrlParams>,
	contains: string,
): Prisma.UserWhereInput {
	const { status, from, to } = filterData
	const isEnabled = !!status && status !== 'ALL'
	const isNew = status === MemberStatus.NEW
	const startDate = normalizeDate(new Date(from), 'start')
	const endDate = normalizeDate(new Date(to), 'end')

	return {
		departmentId,
		isActive: true,
		deletedAt: null,
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
		...(isEnabled
			? {
					createdAt: isNew
						? { gte: startDate, lte: endDate }
						: { lte: startDate },
				}
			: { createdAt: { lte: endDate } }),
	}
}

async function exportMembers(
	request: Request,
	currentUser: Awaited<ReturnType<typeof requireUser>>,
	departmentId: string,
) {
	const filterData = getUrlParams(request)
	const { fromDate, toDate, dateRanges } = parseExportDateRanges(filterData)
	const department = await getDepartmentName(departmentId)

	currentUser.tribeId = null
	currentUser.honorFamilyId = null
	currentUser.departmentId = departmentId

	const members = await getExportDepartmentMembers(departmentId, filterData)
	const membersWithAttendances = await buildMembersWithAttendances(
		currentUser,
		members,
		fromDate,
		dateRanges,
	)

	const fileName = `Membres du département ${department?.name ?? ''}`
	const fileLink = await createMembersExcelFile(
		membersWithAttendances,
		toDate,
		fileName,
	)

	return { status: 'success', fileLink: '/' + fileLink }
}
