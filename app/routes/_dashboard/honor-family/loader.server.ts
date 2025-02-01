import { parseWithZod } from '@conform-to/zod'
import { type Prisma, Role } from '@prisma/client'
import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import type { z } from 'zod'
import { MemberStatus } from '~/shared/enum'
import { requireRole } from '~/utils/auth.server'
import { getMonthSundays, normalizeDate } from '~/utils/date'
import { paramsSchema } from './schema'
import { prisma } from '~/utils/db.server'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const { churchId, honorFamilyId } = await requireRole(request, [
		Role.HONOR_FAMILY_MANAGER,
	])

	invariant(churchId, 'Church ID is required')
	invariant(honorFamilyId, 'Department ID is required')

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: paramsSchema })

	if (submission.status !== 'success') {
		throw new Error('Invalid search criteria')
	}

	const { value } = submission

	const filterOptions = getFilterOptions(value, honorFamilyId, churchId)

	const [honorFamily, total, assistants, members, honorFamilyMembers] =
		await Promise.all([
			getHonorFamily(honorFamilyId, churchId),
			getTotalMembersCount(filterOptions.where),
			getAssistants(honorFamilyId, churchId),
			getMembers(filterOptions),
			getAllDepartmentMembers(honorFamilyId, churchId),
		])

	if (!honorFamily) return redirect('/dashboard')

	return json({
		honorFamily: {
			id: honorFamily.id,
			name: honorFamily.name,
			manager: honorFamily.manager,
			createdAt: honorFamily.createdAt,
		},
		total,
		assistants,
		honorFamilyMembers,
		membersAttendances: getMembersAttendances(members),
		filterData: value,
	})
}

async function getHonorFamily(id: string, churchId: string) {
	return prisma.honorFamily.findFirst({
		where: { id, churchId },
		select: {
			id: true,
			name: true,
			manager: {
				select: {
					id: true,
					name: true,
					phone: true,
					location: true,
					createdAt: true,
				},
			},
			createdAt: true,
		},
	})
}

async function getTotalMembersCount(where: Prisma.UserWhereInput) {
	return prisma.user.count({ where })
}

async function getAssistants(honorFamilyId: string, churchId: string) {
	return prisma.user.findMany({
		where: {
			churchId,
			honorFamilyId,
			roles: { has: Role.HONOR_FAMILY_MANAGER },
			managedDepartment: { isNot: { id: honorFamilyId } },
		},
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			createdAt: true,
			integrationDate: true,
			isAdmin: true,
		},
		orderBy: { name: 'asc' },
	})
}

async function getMembers(filterOptions: ReturnType<typeof getFilterOptions>) {
	const { where, take } = filterOptions
	return prisma.user.findMany({
		where,
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			createdAt: true,
			integrationDate: true,
			isAdmin: true,
		},
		orderBy: { name: 'asc' },
		take,
	})
}

async function getAllDepartmentMembers(
	honorFamilyId: string,
	churchId: string,
) {
	return prisma.user.findMany({
		where: { honorFamilyId, churchId },
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			createdAt: true,
			integrationDate: true,
			isAdmin: true,
		},
		orderBy: { name: 'asc' },
	})
}

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

function getFilterOptions(
	params: z.infer<typeof paramsSchema>,
	honorFamilyId: string,
	churchId: string,
): { where: Prisma.UserWhereInput; take: number } {
	const { from, to, query, page, take, status } = params

	const contains = `%${query.replace(/ /g, '%')}%`

	const isAll = status === 'ALL'
	const statusEnabled = !!status && !isAll
	const isNew = status === MemberStatus.NEW

	const startDate = normalizeDate(new Date(from), 'start')
	const endDate = normalizeDate(new Date(to), 'end')

	const where: Prisma.UserWhereInput = {
		honorFamilyId,
		churchId,
		...(!statusEnabled && { createdAt: { lte: endDate } }),
		...(statusEnabled
			? {
					createdAt: isNew
						? { gte: startDate, lte: endDate }
						: { lte: startDate },
				}
			: { createdAt: { lte: endDate } }),
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
	}

	return { where, take: page * take }
}

export type LoaderType = typeof loaderFn
