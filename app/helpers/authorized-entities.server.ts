import type { User } from '@prisma/client'
import { prisma } from '~/infrastructures/database/prisma.server'

export type EntityType = 'tribe' | 'department' | 'honorFamily'

export interface AuthorizedEntity {
	type: EntityType
	id: string
	name?: string
}

async function fetchManagedEntities(userId: string) {
	const [managedTribe, managedDepartment, managedHonorFamily] =
		await Promise.all([
			prisma.tribe.findUnique({
				where: { managerId: userId },
				select: { id: true, name: true },
			}),
			prisma.department.findUnique({
				where: { managerId: userId },
				select: { id: true, name: true },
			}),
			prisma.honorFamily.findUnique({
				where: { managerId: userId },
				select: { id: true, name: true },
			}),
		])

	return { managedTribe, managedDepartment, managedHonorFamily }
}

function extractRoleEntities(user: User): AuthorizedEntity[] {
	const entities: AuthorizedEntity[] = []

	if (user.roles.includes('TRIBE_MANAGER') && user.tribeId)
		entities.push({ type: 'tribe', id: user.tribeId })

	if (user.roles.includes('DEPARTMENT_MANAGER') && user.departmentId)
		entities.push({ type: 'department', id: user.departmentId })

	if (user.roles.includes('HONOR_FAMILY_MANAGER') && user.honorFamilyId)
		entities.push({ type: 'honorFamily', id: user.honorFamilyId })

	return entities
}

function deduplicate(entities: AuthorizedEntity[]): AuthorizedEntity[] {
	const unique = new Map<string, AuthorizedEntity>()
	for (const entity of entities)
		unique.set(`${entity.type}-${entity.id}`, entity)
	return Array.from(unique.values())
}

export async function getAuthorizedEntities(
	user: User,
): Promise<AuthorizedEntity[]> {
	const { managedTribe, managedDepartment, managedHonorFamily } =
		await fetchManagedEntities(user.id)

	const entities: AuthorizedEntity[] = [
		...(managedTribe ? [{ type: 'tribe' as const, ...managedTribe }] : []),
		...(managedDepartment
			? [{ type: 'department' as const, ...managedDepartment }]
			: []),
		...(managedHonorFamily
			? [{ type: 'honorFamily' as const, ...managedHonorFamily }]
			: []),
		...extractRoleEntities(user),
	]

	return deduplicate(entities)
}
