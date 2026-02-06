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

export async function updateManager({
	tx,
	managerId,
	departmentId,
	oldManagerId,
	password,
	secret,
	email,
}: UpdateManagerArgs) {
	const currentManager = await tx.user.findUnique({
		where: { id: managerId },
		select: { roles: true, isAdmin: true },
	})

	if (!currentManager) {
		throw new Error('Manager not found')
	}

	const updatedRoles = [...currentManager.roles]
	if (!updatedRoles.includes(Role.DEPARTMENT_MANAGER)) {
		updatedRoles.push(Role.DEPARTMENT_MANAGER)
	}

	const updateData: any = {
		isAdmin: true,
		roles: updatedRoles,
		managedDepartment: { connect: { id: departmentId } },
		department: { connect: { id: departmentId } },
	}

	if (email) {
		updateData.email = email
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

	await tx.user.update({
		where: { id: managerId },
		data: updateData,
	})

	await updateIntegrationDates({
		tx,
		entityType: 'department',
		newManagerId: managerId,
		oldManagerId: oldManagerId ?? undefined,
		newMemberIds: [],
		currentMemberIds: [],
	})
}

export async function handleManagerChange(tx: PrismaTx, oldManagerId: string) {
	const oldManager = await tx.user.findUnique({
		where: { id: oldManagerId },
		select: { roles: true, password: true },
	})

	if (!oldManager) return

	const hasOtherManagerialRoles = oldManager.roles.some(
		role =>
			role !== Role.DEPARTMENT_MANAGER &&
			[Role.TRIBE_MANAGER, Role.HONOR_FAMILY_MANAGER].includes(role),
	)

	const updatedRoles = oldManager.roles.filter(
		role => role !== Role.DEPARTMENT_MANAGER,
	)

	const updateData: any = {
		roles: updatedRoles,
		managedDepartment: { disconnect: true },
	}

	if (!hasOtherManagerialRoles && oldManager.password) {
		updateData.password = { delete: true }
		updateData.isAdmin = false
	}

	await tx.user.update({
		where: { id: oldManagerId },
		data: updateData,
	})
}
