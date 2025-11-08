import { prisma, type PrismaTx } from '~/utils/db.server'
import { type DepartmentFormData } from './model'
import invariant from 'tiny-invariant'

import {
	handleMemberSelection,
	fetchManagerMemberData,
	removeDuplicateMembers,
} from '~/utils/process-member-model'

import { handleManagerChange, updateManager } from './manager-operations.server'
import { handleRemovedMembers, upsertMembers } from './member-operations.server'

interface HandleDepartmentArgs {
	data: DepartmentFormData
	churchId: string
	isCreate: boolean
	id?: string
}

const argonSecretKey = process.env.ARGON_SECRET_KEY

export async function handleDepartment({
	data,
	churchId,
	isCreate,
	id,
}: HandleDepartmentArgs) {
	invariant(argonSecretKey, 'ARGON_SECRET_KEY must be defined in .env file')

	const memberData = await getMemberData(data)

	await prisma.$transaction(async tx => {
		let department: any
		let currentMemberIds: string[] = []
		// let oldManagerId: string | undefined

		if (isCreate) {
			department = await tx.department.create({
				data: {
					name: data.name,
					church: { connect: { id: churchId } },
					manager: { connect: { id: data.managerId } },
				},
			})
		} else {
			const currentDepartment = await tx.department.findUnique({
				where: { id },
				include: { manager: true, members: true },
			})

			invariant(currentDepartment, 'Department not found')
			currentMemberIds = currentDepartment.members.map(member => member.id)

			department = await tx.department.update({
				where: { id },
				data: {
					name: data.name,
					manager: { connect: { id: data.managerId } },
				},
			})

			if (
				currentDepartment.manager &&
				currentDepartment.manager.id !== data.managerId
			) {
				await handleManagerChange(tx, currentDepartment.manager.id)
			}

			await handleRemovedMembers(tx, currentDepartment.members, memberData)
		}

		const commonData = {
			tx: tx as unknown as PrismaTx,
			departmentId: department.id,
		}

		await upsertMembers({
			...commonData,
			memberData,
			currentMemberIds,
			churchId,
		})

		await updateManager({
			...commonData,
			managerId: data.managerId,
			password: data.password,
			secret: argonSecretKey,
			email: data.managerEmail,
		})
	})
}

async function getMemberData(payload: DepartmentFormData) {
	const manager = await fetchManagerMemberData(payload.managerId, prisma)
	const { data, errors } = await handleMemberSelection(payload, prisma)
	if (errors.length > 0) throw new Error('Invalid data', { cause: errors })
	return removeDuplicateMembers([manager, ...data])
}
