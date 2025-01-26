import { parseWithZod } from '@conform-to/zod'
import { type Prisma, Role } from '@prisma/client'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const querySchema = z.object({
	entitiesToExclude: z
		.string()
		.trim()
		.optional()
		.transform(v => (v?.length ? v.split(';') : [])),
	managerIdToInclude: z
		.string()
		.optional()
		.transform(v => (v === 'undefined' ? undefined : v)),
	isAdmin: z
		.string()
		.optional()
		.transform(v => v === 'true'),
	isActive: z
		.string()
		.optional()
		.default('true')
		.transform(v => v === 'true'),
})

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const entitiesToExclude = Object.fromEntries(
		submission.value.entitiesToExclude.map(prop => [prop, null]),
	)

	const baseWhereClause: Prisma.UserWhereInput = {
		churchId: currentUser.churchId,
		isActive: submission.value.isActive,
		isAdmin: submission.value.isAdmin,
		...entitiesToExclude,
		NOT: {
			OR: [{ roles: { equals: [Role.SUPER_ADMIN] } }, { id: currentUser.id }],
		},
	}

	let whereClause: Prisma.UserWhereInput

	if (submission.value.managerIdToInclude) {
		whereClause = {
			OR: [
				baseWhereClause,
				{
					id: submission.value.managerIdToInclude,
				},
			],
		}
	} else {
		whereClause = baseWhereClause
	}

	const data = await prisma.user.findMany({
		where: whereClause,
		select: {
			id: true,
			name: true,
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
