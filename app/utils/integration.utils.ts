import { hash } from '@node-rs/argon2'
import { type Prisma, Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { prisma } from './db.server'

type EntityType = 'tribe' | 'family' | 'department'
type DateField = 'tribeDate' | 'familyDate' | 'departementDate'

interface EntityConfig {
	type: EntityType
	dateField: DateField
	managerRole: Role
}

const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
	tribe: {
		type: 'tribe',
		dateField: 'tribeDate',
		managerRole: Role.TRIBE_MANAGER,
	},
	family: {
		type: 'family',
		dateField: 'familyDate',
		managerRole: Role.HONOR_FAMILY_MANAGER,
	},
	department: {
		type: 'department',
		dateField: 'departementDate',
		managerRole: Role.DEPARTMENT_MANAGER,
	},
}

interface UpdateIntegrationDatesParams {
	tx: Prisma.TransactionClient
	entityType: EntityType
	newManagerId?: string
	oldManagerId?: string
	newMemberIds: string[]
	currentMemberIds: string[]
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

	// Handle manager changes
	if (newManagerId && oldManagerId && newManagerId !== oldManagerId) {
		await updateManagerIntegrationDate(tx, {
			newManagerId,
			oldManagerId,
			entityType,
			dateField,
		})
	}

	// Handle member changes
	const membersToUpdate = newMemberIds.filter(
		id => !currentMemberIds.includes(id),
	)
	await updateMembersIntegrationDates(tx, membersToUpdate, dateField, now)
}

interface UpdateManagerIntegrationDateParams {
	newManagerId: string
	oldManagerId: string
	entityType: EntityType
	dateField: DateField
}

async function updateManagerIntegrationDate(
	tx: Prisma.TransactionClient,
	{
		newManagerId,
		oldManagerId,
		entityType,
		dateField,
	}: UpdateManagerIntegrationDateParams,
) {
	const now = new Date()
	const { managerRole } = ENTITY_CONFIG[entityType]

	// Update new manager's integration date
	await tx.integrationDate.upsert({
		where: { userId: newManagerId },
		create: {
			userId: newManagerId,
			[dateField]: now,
		},
		update: {
			[dateField]: now,
		},
	})

	// Handle old manager's roles and status
	const oldManager = await tx.user.findUnique({
		where: { id: oldManagerId },
		select: { roles: true },
	})

	if (!oldManager) return

	const hasOtherManagerialRoles = oldManager.roles.some(
		role =>
			role !== managerRole &&
			[
				Role.TRIBE_MANAGER,
				Role.HONOR_FAMILY_MANAGER,
				Role.DEPARTMENT_MANAGER,
			].includes(role),
	)

	const updatedRoles = oldManager.roles.filter(role => role !== managerRole)

	await tx.user.update({
		where: { id: oldManagerId },
		data: {
			roles: updatedRoles,
			...(!hasOtherManagerialRoles && {
				password: { delete: true },
				isAdmin: false,
			}),
		},
	})
}

async function updateMembersIntegrationDates(
	tx: Prisma.TransactionClient,
	memberIds: string[],
	dateField: DateField,
	date: Date,
) {
	if (memberIds.length === 0) return

	await Promise.all(
		memberIds.map(userId =>
			tx.integrationDate.upsert({
				where: { userId },
				create: {
					userId,
					[dateField]: date,
				},
				update: {
					[dateField]: date,
				},
			}),
		),
	)
}

interface EntityManagerUpdateParams {
	tx: Prisma.TransactionClient
	entityId: string
	entityType: EntityType
	newManagerId: string
	oldManagerId?: string
	password?: string
	isCreating: boolean
}

export async function handleEntityManagerUpdate({
	tx,
	entityId,
	entityType,
	newManagerId,
	oldManagerId,
	password,
	isCreating,
}: EntityManagerUpdateParams) {
	const { managerRole } = ENTITY_CONFIG[entityType]

	const currentManager = await tx.user.findUnique({
		where: { id: newManagerId },
		select: { roles: true, isAdmin: true },
	})

	if (!currentManager) {
		throw new Error('Manager not found')
	}

	const hasOtherManagerialRoles = currentManager.roles.some(
		role =>
			role !== managerRole &&
			[
				Role.TRIBE_MANAGER,
				Role.HONOR_FAMILY_MANAGER,
				Role.DEPARTMENT_MANAGER,
			].includes(role),
	)

	const updatedRoles = [...currentManager.roles]
	if (!updatedRoles.includes(managerRole)) {
		updatedRoles.push(managerRole)
	}

	const updateData: Prisma.UserUpdateInput = {
		isAdmin: true,
		roles: [...updatedRoles, Role.ADMIN],
	}

	if (!currentManager.isAdmin && password) {
		const hashedPassword = await hashPassword(password)
		updateData.password = { create: { hash: hashedPassword } }
	}

	if (isCreating && !hasOtherManagerialRoles && !password) {
		throw new Error(
			'Password is required for new managers without other managerial roles',
		)
	}

	await tx.user.update({
		where: { id: newManagerId },
		data: updateData,
	})

	if (oldManagerId && oldManagerId !== newManagerId) {
		await updateIntegrationDates({
			tx,
			entityType,
			newManagerId,
			oldManagerId,
			newMemberIds: [],
			currentMemberIds: [],
		})
	}
}

async function hashPassword(password: string) {
	const { ARGON_SECRET_KEY } = process.env
	invariant(ARGON_SECRET_KEY, 'ARGON_SECRET_KEY env var must be set')

	const hashedPassword = await hash(password, {
		secret: Buffer.from(ARGON_SECRET_KEY),
	})

	return hashedPassword
}

export async function selectMembers(memberIds: string[] | undefined) {
	if (memberIds && memberIds.length > 0) {
		return await prisma.user.findMany({
			where: { id: { in: memberIds } },
		})
	}
	return []
}
