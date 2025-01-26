import { parseWithZod } from '@conform-to/zod'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { requireUser } from '~/utils/auth.server'
import { getMonthSundays } from '~/utils/date'
import { prisma } from '~/utils/db.server'
import { filterSchema } from './schema'
import invariant from 'tiny-invariant'

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

	const { roles, tribeId, departmentId, honorFamilyId } = user
	const isChurchAdmin = roles.includes('ADMIN')

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
		})

		return json({
			user,
			isChurchAdmin,
			members: getMembersAttendances(allMembers),
			entityStats: [],
			filterData: value,
		})
	}
	type EntityType = 'tribe' | 'department' | 'honorFamily'

	const userEntities: {
		type: EntityType
		id: string
	}[] = []

	if (tribeId) userEntities.push({ type: 'tribe', id: tribeId })
	if (departmentId) userEntities.push({ type: 'department', id: departmentId })
	if (honorFamilyId)
		userEntities.push({ type: 'honorFamily', id: honorFamilyId })

	invariant(
		userEntities.length > 0,
		"L'utilisateur n'est pas responsable d'une entité valide.",
	)

	let selectedEntity: {
		type: 'tribe' | 'department' | 'honorFamily'
		id: string
	} | null = null

	if (value.entityType && value.entityId) {
		const matchingEntity = userEntities.find(
			entity =>
				entity.type === value.entityType && entity.id === value.entityId,
		)

		if (matchingEntity) {
			selectedEntity = matchingEntity
		}
	}

	if (!selectedEntity) {
		selectedEntity = userEntities[0]
	}

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
	})

	let entityName: any

	switch (selectedEntity.type) {
		case 'tribe':
			entityName = await prisma.tribe.findUnique({
				where: { id: selectedEntity.id },
				select: { name: true },
			})
			break

		case 'honorFamily':
			entityName = await prisma.honorFamily.findUnique({
				where: { id: selectedEntity.id },
				select: { name: true },
			})
			break

		case 'department':
			entityName = await prisma.department.findUnique({
				where: { id: selectedEntity.id },
				select: { name: true },
			})
			break
	}

	if (!entityName) {
		throw new Error(
			"L'entité spécifiée n'existe pas ou l'utilisateur n'en est pas le responsable.",
		)
	}

	const additionalEntityStats = userEntities
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
				memberCount: members.length,
				members: getMembersAttendances(members),
			},
			...resolvedAdditionalEntityStats,
		],
		filterData: value,
	})
}

async function getEntityStats(
	type: 'tribe' | 'department' | 'honorFamily',
	id: string,
	filterValue: any,
) {
	const baseWhere = {
		createdAt: {
			gte: new Date(filterValue.from),
			lte: new Date(filterValue.to),
		},
	}

	let entityName: any

	const members = await prisma.user.findMany({
		where: {
			[`${type}Id`]: id,
			...baseWhere,
		},
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			integrationDate: true,
			createdAt: true,
		},
	})

	switch (type) {
		case 'tribe':
			entityName = await prisma.tribe.findUnique({
				where: { id },
				select: { name: true },
			})

			break

		case 'honorFamily':
			entityName = await prisma.honorFamily.findUnique({
				where: { id },
				select: { name: true },
			})

			break

		case 'department':
			entityName = await prisma.department.findUnique({
				where: { id },
				select: { name: true },
			})

			break
	}

	return {
		id,
		type,
		entityName: entityName?.name || '',
		memberCount: members.length,
		members: getMembersAttendances(members),
	}
}
export type LoaderType = typeof loaderFn

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
