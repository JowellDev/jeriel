import { hash } from '@node-rs/argon2'
import { type Prisma, Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { prisma } from '~/infrastructures/database/prisma.server'

type EntityType = 'tribe' | 'honorFamily' | 'department'
type DateField = 'tribeDate' | 'familyDate' | 'departementDate'

interface EntityConfig {
	type: EntityType
	dateField: DateField
	managerRole: Role
}

const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
	tribe: { type: 'tribe', dateField: 'tribeDate', managerRole: Role.TRIBE_MANAGER },
	honorFamily: { type: 'honorFamily', dateField: 'familyDate', managerRole: Role.HONOR_FAMILY_MANAGER },
	department: { type: 'department', dateField: 'departementDate', managerRole: Role.DEPARTMENT_MANAGER },
}

interface UpdateIntegrationDatesParams {
	tx: Prisma.TransactionClient
	entityType: EntityType
	newManagerId?: string
	oldManagerId?: string | null
	newMemberIds: string[]
	currentMemberIds: string[]
}

interface UpdateManagerIntegrationDateParams {
	newManagerId: string
	oldManagerId: string
	entityType: EntityType
	dateField: DateField
}

interface EntityManagerUpdateParams {
	tx: Prisma.TransactionClient
	entityId: string
	entityType: EntityType
	newManagerId: string
	oldManagerId?: string
	password?: string
	managerEmail?: string
	isCreating: boolean
}

export async function updateIntegrationDates({
	tx,
	entityType,
	newManagerId,
	oldManagerId,
	newMemberIds,
	currentMemberIds,
}: UpdateIntegrationDatesParams) {
	const { dateField } = ENTITY_CONFIG[entityType]
	const now = new Date()

	if (newManagerId && oldManagerId && newManagerId !== oldManagerId) {
		await updateManagerIntegrationDate(tx, { newManagerId, oldManagerId, entityType, dateField })
	}

	const membersToUpdate = newMemberIds.filter(id => !currentMemberIds.includes(id))
	await updateMembersIntegrationDates(tx, membersToUpdate, dateField, now)
}

async function setNewManagerIntegrationDate(
	tx: Prisma.TransactionClient,
	newManagerId: string,
	dateField: DateField,
) {
	const now = new Date()
	await tx.integrationDate.upsert({
		where: { userId: newManagerId },
		create: { userId: newManagerId, [dateField]: now },
		update: { [dateField]: now },
	})
}

const MANAGERIAL_ROLES = [Role.TRIBE_MANAGER, Role.HONOR_FAMILY_MANAGER, Role.DEPARTMENT_MANAGER]

function buildOldManagerUpdateData(
	oldManager: { roles: Role[]; password: any },
	managerRole: Role,
): Prisma.UserUpdateInput {
	const hasOtherManagerialRoles = oldManager.roles.some(
		role => role !== managerRole && MANAGERIAL_ROLES.includes(role),
	)
	const updatedRoles = oldManager.roles.filter(role => role !== managerRole)
	const updateData: Prisma.UserUpdateInput = { roles: updatedRoles }

	if (!hasOtherManagerialRoles && oldManager.password) {
		updateData.password = { delete: true }
		updateData.isAdmin = false
	}

	return updateData
}

async function updateManagerIntegrationDate(
	tx: Prisma.TransactionClient,
	{ newManagerId, oldManagerId, entityType, dateField }: UpdateManagerIntegrationDateParams,
) {
	const { managerRole } = ENTITY_CONFIG[entityType]
	await setNewManagerIntegrationDate(tx, newManagerId, dateField)

	const oldManager = await tx.user.findUnique({
		where: { id: oldManagerId },
		select: { roles: true, password: true },
	})
	if (!oldManager) return

	const updateData = buildOldManagerUpdateData(oldManager, managerRole)
	await tx.user.update({ where: { id: oldManagerId }, data: updateData })
}

async function updateMembersIntegrationDates(
	tx: Prisma.TransactionClient,
	memberIds: string[],
	dateField: DateField,
	date: Date,
) {
	if (memberIds.length === 0) return

	return Promise.all(
		memberIds.map(userId =>
			tx.integrationDate.upsert({
				where: { userId },
				create: { userId, [dateField]: date },
				update: { [dateField]: date },
			}),
		),
	)
}

function buildManagerRoles(currentRoles: Role[], managerRole: Role): Role[] {
	const updatedRoles = [...currentRoles]
	if (!updatedRoles.includes(managerRole)) updatedRoles.push(managerRole)
	return updatedRoles
}

async function buildNewManagerUpdateData(
	currentManager: { roles: Role[]; isAdmin: boolean },
	managerRole: Role,
	password: string | undefined,
	managerEmail: string | undefined,
): Promise<Prisma.UserUpdateInput> {
	const updatedRoles = buildManagerRoles(currentManager.roles, managerRole)
	const updateData: Prisma.UserUpdateInput = { isAdmin: true, roles: updatedRoles, email: managerEmail }

	if (!currentManager.isAdmin && password) {
		const hashedPassword = await hashPassword(password)
		updateData.password = { create: { hash: hashedPassword } }
	}

	return updateData
}

function validateNewManagerPassword(
	currentManager: { roles: Role[] },
	managerRole: Role,
	password: string | undefined,
	isCreating: boolean,
) {
	const hasOtherManagerialRoles = currentManager.roles.some(
		role => role !== managerRole && MANAGERIAL_ROLES.includes(role),
	)
	if (isCreating && !hasOtherManagerialRoles && !password) {
		throw new Error('Password is required for new managers without other managerial roles')
	}
}

export async function handleEntityManagerUpdate({
	tx,
	entityType,
	newManagerId,
	oldManagerId,
	password,
	managerEmail,
	isCreating,
}: EntityManagerUpdateParams) {
	const { managerRole } = ENTITY_CONFIG[entityType]
	const currentManager = await tx.user.findUnique({
		where: { id: newManagerId },
		select: { roles: true, isAdmin: true },
	})
	if (!currentManager) throw new Error('Manager not found')

	validateNewManagerPassword(currentManager, managerRole, password, isCreating)

	const updateData = await buildNewManagerUpdateData(currentManager, managerRole, password, managerEmail)
	await tx.user.update({ where: { id: newManagerId }, data: updateData })

	if (oldManagerId && oldManagerId !== newManagerId) {
		await updateIntegrationDates({ tx, entityType, newManagerId, oldManagerId, newMemberIds: [], currentMemberIds: [] })
	}
}

async function hashPassword(password: string) {
	const { ARGON_SECRET_KEY } = process.env
	invariant(ARGON_SECRET_KEY, 'ARGON_SECRET_KEY env var must be set')
	return hash(password, { secret: Buffer.from(ARGON_SECRET_KEY) })
}

export async function fetchEntityMemberIds(entityType: EntityType, entityId: string): Promise<string[]> {
	const select = { members: { select: { id: true } } }

	if (entityType === 'tribe') {
		const entity = await prisma.tribe.findUnique({ where: { id: entityId }, select })
		return entity?.members.map(m => m.id) ?? []
	}
	if (entityType === 'department') {
		const entity = await prisma.department.findUnique({ where: { id: entityId }, select })
		return entity?.members.map(m => m.id) ?? []
	}
	const entity = await prisma.honorFamily.findUnique({ where: { id: entityId }, select })
	return entity?.members.map(m => m.id) ?? []
}

export async function selectMembers(memberIds: string[] | undefined) {
	if (memberIds && memberIds.length > 0) {
		return prisma.user.findMany({ where: { id: { in: memberIds } } })
	}
	return []
}
