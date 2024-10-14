import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { querySchema } from './schema'
import type { Prisma } from '@prisma/client'
import { prisma } from '~/utils/db.server'
import { requireUser } from '~/utils/auth.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	invariant(currentUser.churchId, 'Church ID is required')

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const filterOption = submission.value

	const contains = `%${filterOption.query.replace(/ /g, '%')}%`

	const commonWhere = {
		churchId: currentUser.churchId,
		name: { contains, mode: 'insensitive' as Prisma.QueryMode },
	}

	const result = await prisma.$transaction(async tx => {
		const [tribes, departments, honorFamilies] = await Promise.all([
			tx.tribe.findMany({
				where: commonWhere,
				select: { id: true, name: true, manager: true, createdAt: true },
				take: filterOption.take,
				skip: (filterOption.page - 1) * filterOption.take,
			}),
			tx.department.findMany({
				where: commonWhere,
				select: { id: true, name: true, manager: true, createdAt: true },
				take: filterOption.take,
				skip: (filterOption.page - 1) * filterOption.take,
			}),
			tx.honorFamily.findMany({
				where: commonWhere,
				select: { id: true, name: true, manager: true, createdAt: true },
				take: filterOption.take,
				skip: (filterOption.page - 1) * filterOption.take,
			}),
		])

		const [tribesCount, departmentsCount, honorFamiliesCount] =
			await Promise.all([
				tx.tribe.count({ where: commonWhere }),
				tx.department.count({ where: commonWhere }),
				tx.honorFamily.count({ where: commonWhere }),
			])

		return {
			items: [
				...tribes.map(t => ({ ...t, entityType: 'tribe' as const })),
				...departments.map(d => ({ ...d, entityType: 'department' as const })),
				...honorFamilies.map(h => ({
					...h,
					entityType: 'honorFamily' as const,
				})),
			],
			total: {
				tribes: tribesCount,
				departments: departmentsCount,
				honorFamilies: honorFamiliesCount,
			},
		}
	})

	return json({
		items: result.items,
		filterOption,
		total: result.total,
	} as const)
}

export type LoaderType = typeof loaderFn
