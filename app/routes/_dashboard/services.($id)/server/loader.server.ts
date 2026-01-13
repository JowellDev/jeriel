import { parseWithZod } from '@conform-to/zod'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireRole } from '~/utils/auth.server'
import { filterSchema } from '../schema'
import invariant from 'tiny-invariant'
import { type User, type Prisma } from '@prisma/client'
import { type z } from 'zod'
import { prisma } from '~/infrastructures/database/prisma.server'
import type { ServiceData } from '../types'

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

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireRole(request, [
		'ADMIN',
		'DEPARTMENT_MANAGER',
		'TRIBE_MANAGER',
	])

	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const { value: filterData } = submission

	const isAdmin = currentUser.roles.includes('ADMIN')

	let where: Prisma.ServiceWhereInput = getServiceWhereClause(
		currentUser,
		filterData,
		isAdmin,
	)

	const [services, total] = await Promise.all([
		getServices(filterData, where),
		prisma.service.count({ where }),
	])

	return { total, services, filterData, isAdmin }
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

function getServiceWhereClause(
	{ roles, departmentId, tribeId, churchId }: User,
	filterParams: z.infer<typeof filterSchema>,
	isAdmin: boolean,
): Prisma.ServiceWhereInput {
	const { query } = filterParams

	const contains = `%${query.replace(/ /g, '%')}%`

	return {
		churchId,
		AND: [
			{
				...(!isAdmin && {
					OR: [
						{ ...(roles.includes('DEPARTMENT_MANAGER') && { departmentId }) },
						{ ...(roles.includes('TRIBE_MANAGER') && { tribeId }) },
					],
				}),
			},
			{
				OR: [
					{ department: { name: { contains, mode: 'insensitive' } } },
					{ tribe: { name: { contains, mode: 'insensitive' } } },
				],
			},
		],
	}
}
