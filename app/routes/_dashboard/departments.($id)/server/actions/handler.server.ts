import { prisma, type PrismaTx } from '~/infrastructures/database/prisma.server'
import { type DepartmentFormData } from '../../model'
import invariant from 'tiny-invariant'

import {
	handleMemberSelection,
	fetchManagerMemberData,
	removeDuplicateMembers,
} from '~/helpers/process-members-upload.server'

import { handleManagerChange, updateManager } from './manager-operations.server'
import { handleRemovedMembers, upsertMembers } from './member-operations.server'

interface HandleDepartmentArgs {
	data: DepartmentFormData
	churchId: string
	isCreate: boolean
	id?: string
}

const argonSecretKey = process.env.ARGON_SECRET_KEY

async function runDepartmentTransaction(
	tx: PrismaTx,
	data: DepartmentFormData,
	churchId: string,
	isCreate: boolean,
	id: string | undefined,
	memberData: any[],
) {
	const { department, currentMemberIds, oldManagerId } = isCreate
		? await createDepartment(tx, data.name, churchId, data.managerId)
		: await updateDepartment(tx, id!, data, memberData)
	await upsertMembers({
		tx,
		departmentId: department.id,
		memberData,
		currentMemberIds,
		churchId,
	})
	await updateManager({
		tx,
		departmentId: department.id,
		managerId: data.managerId,
		oldManagerId,
		password: data.password,
		secret: argonSecretKey!,
		email: data.managerEmail,
	})
}

export async function handleDepartment({
	data,
	churchId,
	isCreate,
	id,
}: HandleDepartmentArgs) {
	invariant(argonSecretKey, 'ARGON_SECRET_KEY must be defined in .env file')
	const memberData = await getMemberData(data)
	await prisma.$transaction(async tx =>
		runDepartmentTransaction(
			tx as unknown as PrismaTx,
			data,
			churchId,
			isCreate,
			id,
			memberData,
		),
	)
}

async function createDepartment(
	tx: PrismaTx,
	name: string,
	churchId: string,
	managerId: string,
) {
	const department = await tx.department.create({
		data: {
			name,
			church: { connect: { id: churchId } },
			manager: { connect: { id: managerId } },
		},
	})
	return {
		department,
		currentMemberIds: [] as string[],
		oldManagerId: null as string | null,
	}
}

function detectManagerChange(
	manager: { id: string } | null,
	newManagerId: string,
): string | null {
	return manager && manager.id !== newManagerId ? manager.id : null
}

async function updateDepartment(
	tx: PrismaTx,
	id: string,
	data: DepartmentFormData,
	memberData: any[],
) {
	const currentDepartment = await tx.department.findUnique({
		where: { id },
		include: { manager: true, members: true },
	})
	invariant(currentDepartment, 'Department not found')

	const currentMemberIds = currentDepartment.members.map(m => m.id)
	const oldManagerId = detectManagerChange(
		currentDepartment.manager,
		data.managerId,
	)
	const department = await tx.department.update({
		where: { id },
		data: { name: data.name, manager: { connect: { id: data.managerId } } },
	})

	if (oldManagerId) await handleManagerChange(tx, oldManagerId)

	await handleRemovedMembers(tx, currentDepartment.members, memberData)

	return { department, currentMemberIds, oldManagerId }
}

async function getMemberData(payload: DepartmentFormData) {
	const manager = await fetchManagerMemberData(payload.managerId, prisma)
	const { data, errors } = await handleMemberSelection(payload, prisma)

	if (errors.length > 0) throw new Error(errors.join(' | '))

	return removeDuplicateMembers([manager, ...data])
}
