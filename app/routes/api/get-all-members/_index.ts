import { parseWithZod } from '@conform-to/zod'
import { type Prisma, Role } from '@prisma/client'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import { querySchema } from './schema'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const filterParams = submission.value

	const entitiesToExclude = Object.fromEntries(
		filterParams.entitiesToExclude.map(prop => [prop, null]),
	)

	const baseWhereClause: Prisma.UserWhereInput = {
		churchId: currentUser.churchId,
		isActive: submission.value.isActive,
		isAdmin: submission.value.isAdmin,
		tribeId: filterParams.tribeId,
		departmentId: filterParams.departmentId,
		honorFamilyId: filterParams.honorFamilyId,
		...entitiesToExclude,
		NOT: {
			OR: [
				{ roles: { equals: [Role.SUPER_ADMIN] } },
				{ ...(filterParams.excludeCurrentMember && { id: currentUser.id }) },
			],
		},
	}

	const where: Prisma.UserWhereInput = {
		OR: [
			baseWhereClause,
			{
				...(filterParams.managerIdToInclude && {
					id: submission.value.managerIdToInclude,
				}),
			},
		],
	}

	const data = await prisma.user.findMany({
		where,
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
			roles: true,
			isAdmin: true,
			departmentId: true,
			tribeId: true,
			honorFamilyId: true,
			deletedAt: true,
		},
		orderBy: { name: 'asc' },
	})

	return json(data)
}

export type GetAllMembersApiData = typeof loader

export type MemberOption = { value: string; label: string }
