import { type PrismaTx } from '~/utils/db.server'
import { hash } from '@node-rs/argon2'
import { updateIntegrationDates } from '~/utils/integration.utils'

interface UpdateManagerArgs {
	tx: PrismaTx
	managerId: string
	departmentId: string
	password?: string
	secret?: string
	email?: string
}

export async function updateManager({
	tx,
	managerId,
	departmentId,
	password,
	secret,
	email,
}: UpdateManagerArgs) {
	const updateData: any = {
		isAdmin: true,
		roles: { push: 'DEPARTMENT_MANAGER' },
		managedDepartment: { connect: { id: departmentId } },
	}

	if (email) {
		updateData.email = email
	}

	if (password && secret) {
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
		newMemberIds: [],
		currentMemberIds: [],
	})
}

export async function handleManagerChange(tx: any, oldManagerId: string) {
	await tx.user.update({
		where: { id: oldManagerId },
		data: {
			roles: {
				set: (roles: string[]) =>
					roles.filter(role => role !== 'DEPARTMENT_MANAGER'),
			},
			managedDepartment: { disconnect: true },
		},
	})
}
