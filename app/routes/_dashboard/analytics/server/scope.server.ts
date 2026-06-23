import { Role, type Prisma } from '@prisma/client'
import type { AuthenticatedUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import {
	getAuthorizedEntities,
	type AuthorizedEntity,
	type EntityType,
} from '~/helpers/authorized-entities.server'
import type { AnalyticsFilter } from '../schema'
import type { AnalyticsScope, ScopeEntity } from '../types'

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN]

/** Filtre commun : membres actifs, hors comptes administrateurs. */
const SOFT_MEMBER_FILTER = {
	isActive: true,
	NOT: { roles: { hasSome: ADMIN_ROLES } },
}

function isAdminUser(user: AuthenticatedUser): boolean {
	return user.roles.some(r => ADMIN_ROLES.includes(r))
}

async function fetchEntityName(
	type: EntityType,
	id: string,
): Promise<string | null> {
	const where = { id }
	const select = { name: true }
	if (type === 'tribe') {
		return (await prisma.tribe.findUnique({ where, select }))?.name ?? null
	}
	if (type === 'department') {
		return (await prisma.department.findUnique({ where, select }))?.name ?? null
	}
	return (await prisma.honorFamily.findUnique({ where, select }))?.name ?? null
}

async function resolveEntityName(entity: AuthorizedEntity): Promise<string> {
	if (entity.name) return entity.name
	return (await fetchEntityName(entity.type, entity.id)) ?? 'Entité'
}

async function toScopeEntities(
	entities: AuthorizedEntity[],
): Promise<ScopeEntity[]> {
	return Promise.all(
		entities.map(async e => ({
			type: e.type,
			id: e.id,
			name: await resolveEntityName(e),
		})),
	)
}

function pickSelectedEntity(
	entities: ScopeEntity[],
	filter: AnalyticsFilter,
): ScopeEntity | null {
	if (entities.length === 0) return null
	const match = entities.find(
		e => e.type === filter.entityType && e.id === filter.entityId,
	)
	return match ?? entities[0]
}

function entityMemberWhere(
	type: EntityType,
	id: string,
): Prisma.UserWhereInput {
	return { [`${type}Id`]: id, ...SOFT_MEMBER_FILTER }
}

/**
 * Résout le périmètre d'analyse et le filtre Prisma des membres.
 * Admin → église entière ; responsable → son entité sélectionnée.
 */
export async function resolveScope(
	user: AuthenticatedUser,
	filter: AnalyticsFilter,
): Promise<{ scope: AnalyticsScope; memberWhere: Prisma.UserWhereInput }> {
	if (isAdminUser(user) && user.churchId) {
		return buildAdminScope(user.churchId)
	}

	const entities = await toScopeEntities(await getAuthorizedEntities(user))
	const selectedEntity = pickSelectedEntity(entities, filter)

	const memberWhere = selectedEntity
		? entityMemberWhere(selectedEntity.type, selectedEntity.id)
		: { id: '__none__' }

	return {
		scope: {
			isAdmin: false,
			churchId: user.churchId,
			selectedEntity,
			entities,
			label: selectedEntity?.name ?? 'Aucune entité',
		},
		memberWhere,
	}
}

async function buildAdminScope(churchId: string) {
	return {
		scope: {
			isAdmin: true,
			churchId,
			selectedEntity: null,
			entities: [],
			label: "Toute l'église",
		} satisfies AnalyticsScope,
		memberWhere: { churchId, ...SOFT_MEMBER_FILTER } as Prisma.UserWhereInput,
	}
}

export { ADMIN_ROLES, SOFT_MEMBER_FILTER }
