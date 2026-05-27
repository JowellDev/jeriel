import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { paramsSchema } from '../schema'
import { prisma } from '~/infrastructures/database/prisma.server'
import type { GetMembersData } from '../types'
import { getDateFilterOptions } from '~/helpers/attendance.server'
import { type Prisma } from '@prisma/client'
import type { Member } from '~/models/member.model'

export function getUrlParams(request: Request) {
	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, {
		schema: paramsSchema,
	})

	invariant(submission.status === 'success', 'invalid criteria')

	return submission.value
}

export async function getTribeName(id: string) {
	return await prisma.tribe.findFirst({
		where: { id },
		select: { name: true },
	})
}

export async function getExportTribeMembers({
	id,
	filterData,
}: GetMembersData): Promise<Member[]> {
	const where = buildUserWhereInput({ id, filterData })

	return prisma.user.findMany({
		where,
		select: {
			id: true,
			integrationDate: true,
			name: true,
			email: true,
			phone: true,
			location: true,
			createdAt: true,
			pictureUrl: true,
			gender: true,
			birthday: true,
			maritalStatus: true,
		},
		orderBy: { name: 'asc' },
	})
}

export function buildUserWhereInput({
	id,
	filterData,
}: GetMembersData): Prisma.UserWhereInput {
	const { query } = filterData
	const contains = `%${query.replace(/ /g, '%')}%`

	return {
		tribeId: id,
		isActive: true,
		deletedAt: null,
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
		...getDateFilterOptions(filterData),
	} satisfies Prisma.UserWhereInput
}
