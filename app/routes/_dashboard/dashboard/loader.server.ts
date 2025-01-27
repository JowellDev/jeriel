import { parseWithZod } from '@conform-to/zod'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { filterSchema } from './schema'
import invariant from 'tiny-invariant'
import {
	getAuthorizedEntities,
	getEntityName,
	getEntityStats,
	getMembersAttendances,
} from './utils.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const user = await requireUser(request)
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')
	const { value } = submission

	const baseWhere = {
		createdAt: {
			gte: new Date(value.from),
			lte: new Date(value.to),
		},
	}


	const { roles } = user
	const isChurchAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')

	if (isChurchAdmin) {
		const allMembers = await prisma.user.findMany({
			select: {
				id: true,
				name: true,
				phone: true,
				location: true,
				integrationDate: true,
				createdAt: true,
			},
			orderBy: { createdAt: 'desc' },
			take: value.page * value.take,
		})

		return json({
			user,
			isChurchAdmin,
			members: getMembersAttendances(allMembers),
			entityStats: [],
			filterData: value,
			total: null,
		})
	}

	const authorizedEntities = await getAuthorizedEntities(user)

	invariant(
		authorizedEntities.length > 0,
		"L'utilisateur n'est pas autorisé à accéder aux données d'une entité.",
	)

	let selectedEntity =
		value.entityType && value.entityId
			? authorizedEntities.find(
					entity =>
						entity.type === value.entityType && entity.id === value.entityId,
				)
			: authorizedEntities[0]

	invariant(selectedEntity, 'Impossible de sélectionner une entité valide.')

	const contains = `%${value.query.replace(/ /g, '%')}%`

	const members = await prisma.user.findMany({
		where: {
			[`${selectedEntity.type}Id`]: selectedEntity.id,
			...baseWhere,
			OR: [
				{ name: { contains, mode: 'insensitive' } },
				{ phone: { contains } },
			],
		},
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			integrationDate: true,
			createdAt: true,
		},
		take: value.page * value.take,
	})

	const total = await prisma.user.count({
		where: { [`${selectedEntity.type}Id`]: selectedEntity.id, ...baseWhere },
	})

	const membersCount = await prisma.user.count({
		where: { [`${selectedEntity.type}Id`]: selectedEntity.id },
	})

	const entityName = await getEntityName(selectedEntity)

	if (!entityName) {
		throw new Error(
			"L'entité spécifiée n'existe pas ou l'utilisateur n'en est pas le responsable.",
		)
	}

	const additionalEntityStats = authorizedEntities
		.filter(entity => entity.id !== selectedEntity?.id)
		.map(async entity => await getEntityStats(entity.type, entity.id, value))

	const resolvedAdditionalEntityStats = await Promise.all(additionalEntityStats)

	return json({
		user,
		isChurchAdmin: false,
		members: getMembersAttendances(members),
		entityStats: [
			{
				id: selectedEntity.id,
				type: selectedEntity.type,
				entityName: entityName.name,
				memberCount: membersCount,
				members: getMembersAttendances(members),
			},
			...resolvedAdditionalEntityStats,
		],
		total,
		filterData: value,
	})
}

export type LoaderType = typeof loaderFn
