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

	let entityType: 'tribe' | 'department' | 'honorFamily' | null = null
	let entityId: string | null = null

	if (tribeId) {
		entityType = 'tribe'
		entityId = tribeId
	} else if (departmentId) {
		entityType = 'department'
		entityId = departmentId
	} else if (honorFamilyId) {
		entityType = 'honorFamily'
		entityId = honorFamilyId
	}

	invariant(
		entityType && entityId,
		"L'utilisateur n'est pas responsable d'une entité valide.",
	)

	const members = await prisma.user.findMany({
		where: {
			[`${entityType}Id`]: entityId,
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

	const entityName = await prisma[entityType].findUnique({
		where: { id: entityId },
		select: { name: true },
	})

	if (!entityName) {
		throw new Error(
			"L'entité spécifiée n'existe pas ou l'utilisateur n'en est pas le responsable.",
		)
	}

	return json({
		user,
		isChurchAdmin: false,
		members: getMembersAttendances(members),
		entityStats: [
			{
				id: entityId,
				type: entityType,
				entityName: entityName.name,
				memberCount: members.length,
				members: getMembersAttendances(members),
			},
		],
		filterData: value,
	})
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
