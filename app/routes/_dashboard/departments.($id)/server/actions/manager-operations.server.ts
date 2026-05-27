import { type PrismaTx } from '~/infrastructures/database/prisma.server'
import { hash } from '@node-rs/argon2'
import { updateIntegrationDates } from '~/helpers/integration.server'
import { Role } from '@prisma/client'

interface UpdateManagerArgs {
	tx: PrismaTx
	managerId: string
	departmentId: string
	oldManagerId?: string | null
	password?: string
	secret?: string
	email?: string
}

async function fetchCurrentManager(tx: PrismaTx, managerId: string) {
	const manager = await tx.user.findUnique({
		where: { id: managerId },
		select: { roles: true, isAdmin: true },
	})
	if (!manager) throw new Error('Manager not found')
	return manager
}

function buildManagerRoleUpdate(currentRoles: Role[]): Role[] {
	return currentRoles.includes(Role.DEPARTMENT_MANAGER)
		? [...currentRoles]
		: [...currentRoles, Role.DEPARTMENT_MANAGER]
}

async function buildManagerUpdatePayload(
	currentManager: { roles: Role[]; isAdmin: boolean },
	departmentId: string,
	email?: string,
	password?: string,
	secret?: string,
) {
	const updateData: any = {
		isAdmin: true,
		roles: buildManagerRoleUpdate(currentManager.roles),
		managedDepartment: { connect: { id: departmentId } },
		department: { connect: { id: departmentId } },
		...(email && { email }),
	}
	if (password && secret && !currentManager.isAdmin) {
		const hashedPassword = await hash(password, { secret: Buffer.from(secret) })
		updateData.password = {
			upsert: {
				create: { hash: hashedPassword },
				update: { hash: hashedPassword },
			},
		}
	}
	return updateData
}

async function applyManagerIntegrationUpdate(
	tx: PrismaTx,
	managerId: string,
	oldManagerId?: string | null,
) {
	await updateIntegrationDates({
		tx,
		entityType: 'department',
		newManagerId: managerId,
		oldManagerId: oldManagerId ?? undefined,
		newMemberIds: [],
		currentMemberIds: [],
	})
}

export async function updateManager({
	tx,
	managerId,
	departmentId,
	oldManagerId,
	password,
	secret,
	email,
}: UpdateManagerArgs) {
	const currentManager = await fetchCurrentManager(tx, managerId)
	const updateData = await buildManagerUpdatePayload(currentManager, departmentId, email, password, secret)
	await tx.user.update({ where: { id: managerId }, data: updateData })
	await applyManagerIntegrationUpdate(tx, managerId, oldManagerId)
}

function buildOldManagerUpdateData(oldManager: {
	roles: Role[]
	password: any
}) {
	const hasOtherManagerialRoles = oldManager.roles.some(
		role =>
			role !== Role.DEPARTMENT_MANAGER &&
			[Role.TRIBE_MANAGER, Role.HONOR_FAMILY_MANAGER].includes(role),
	)
	const updateData: any = {
		roles: oldManager.roles.filter(role => role !== Role.DEPARTMENT_MANAGER),
		managedDepartment: { disconnect: true },
	}
	if (!hasOtherManagerialRoles && oldManager.password) {
		updateData.password = { delete: true }
		updateData.isAdmin = false
	}
	return updateData
}

export async function handleManagerChange(tx: PrismaTx, oldManagerId: string) {
	const oldManager = await tx.user.findUnique({
		where: { id: oldManagerId },
		select: { roles: true, password: true },
	})
	if (!oldManager) return
	await tx.user.update({
		where: { id: oldManagerId },
		data: buildOldManagerUpdateData(oldManager),
	})
}
