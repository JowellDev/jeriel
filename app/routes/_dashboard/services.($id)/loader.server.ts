import { parseWithZod } from '@conform-to/zod'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { filterSchema } from './schema'
import invariant from 'tiny-invariant'
import { type Prisma } from '@prisma/client'
import { type z } from 'zod'
import { prisma } from '~/utils/db.server'
import type { ServiceData } from './types'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const { value: filterData } = submission

	const contains = `%${filterData.query.replace(/ /g, '%')}%`

	const searchCondition: Prisma.ServiceWhereInput = {
		OR: [
			{ department: { name: { contains, mode: 'insensitive' } } },
			{ tribe: { name: { contains, mode: 'insensitive' } } },
		],
	}

	let where: Prisma.ServiceWhereInput = { ...searchCondition }

	const isAdmin = currentUser.roles.includes('ADMIN')

	const isDepartmentManager = currentUser.roles.includes('DEPARTMENT_MANAGER')

	const isTribeManager = currentUser.roles.includes('TRIBE_MANAGER')

	if (!isAdmin) {
		const roleBasedConditions: Prisma.ServiceWhereInput[] = []

		if (isDepartmentManager && currentUser.departmentId) {
			roleBasedConditions.push({
				departmentId: currentUser.departmentId,
			})
		}

		if (isTribeManager && currentUser.tribeId) {
			roleBasedConditions.push({
				tribeId: currentUser.tribeId,
			})
		}

		if (roleBasedConditions.length > 0) {
			where = {
				AND: [searchCondition, { OR: roleBasedConditions }],
			}
		} else {
			return json({ total: 0, services: [], filterData, isAdmin })
		}
	}

	const [services, total] = await Promise.all([
		getServices(filterData, where),
		prisma.service.count({ where }),
	])

	return json({ total, services, filterData, isAdmin })
}

export type LoaderType = typeof loaderFn

async function getServices(
	{ take, page }: z.infer<typeof filterSchema>,
	where: Prisma.ServiceWhereInput,
): Promise<ServiceData[]> {
	const services = await prisma.service.findMany({
		where,
		select: {
			id: true,
			from: true,
			to: true,
			tribe: { select: entitySelect },
			department: { select: entitySelect },
		},
		take,
		skip: take * (page - 1),
		orderBy: {
			from: 'desc',
		},
	})

	return services.map(({ id, from, to, tribe, department }) => ({
		id,
		from: new Date(from),
		to: new Date(to),
		entity: {
			type: tribe ? 'tribe' : 'department',
			id: (tribe?.id ?? department?.id) as string,
			name: (tribe?.name ?? department?.name) as string,
			manager: {
				name: tribe?.manager?.name ?? (department?.manager?.name as string),
				phone: tribe?.manager?.phone ?? (department?.manager?.phone as string),
			},
		},
	}))
}

const entitySelect = {
	id: true,
	name: true,
	manager: {
		select: {
			name: true,
			phone: true,
		},
	},
}
