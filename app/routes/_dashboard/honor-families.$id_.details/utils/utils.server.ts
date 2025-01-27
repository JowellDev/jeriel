import { z } from 'zod'
import type { addAssistantSchema, createMemberSchema } from '../schema'
import { prisma } from '~/utils/db.server'
import invariant from 'tiny-invariant'
import type { Prisma } from '@prisma/client'
import { Role } from '@prisma/client'
import { uploadMembers } from '~/utils/member'
import { hash } from '@node-rs/argon2'
import type {
	GetHonorFamilyMembersData,
	GetHonorFamilyAssistantsData,
} from '../types'
import { normalizeDate } from '~/utils/date'
import { STATUS } from '../constants'
import { updateIntegrationDates } from '~/utils/integration.utils'

export const superRefineHandler = async (
	data: Partial<z.infer<typeof createMemberSchema>>,
	ctx: z.RefinementCtx,
) => {
	const isExists = await isPhoneExists(data)

	if (isExists) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['phone'],
			message: 'Numéro de téléphone déjà utilisé',
		})
	}
}

export async function createMember(
	data: z.infer<typeof createMemberSchema>,
	churchId: string,
	honorFamilyId: string,
) {
	return prisma.user.create({
		data: {
			...data,
			roles: [Role.MEMBER],
			church: { connect: { id: churchId } },
			honorFamily: { connect: { id: honorFamilyId } },
			integrationDate: { create: { familyDate: new Date() } },
		},
	})
}

export async function addAssistantToHonorFamily(
	data: z.infer<typeof addAssistantSchema>,
	honorFamilyId: string,
) {
	const { memberId, password } = data

	const member = await prisma.user.findFirst({
		where: { honorFamilyId },
	})

	if (!member)
		throw new Error('This memeber does not belongs to this honor family')

	const updateData: Prisma.UserUpdateInput = {
		isAdmin: true,
		roles: { push: Role.HONOR_FAMILY_MANAGER },
		honorFamily: { connect: { id: honorFamilyId } },
	}

	if (password) {
		const hashedPassword = await hashPassword(password)
		updateData.password = {
			upsert: {
				where: { userId: memberId },
				create: { hash: hashedPassword },
				update: { hash: hashedPassword },
			},
		}
	}

	return prisma.user.update({
		where: { id: memberId },
		data: updateData,
	})
}

export async function uploadHonorFamilyMembers(
	file: File,
	churchId: string,
	honorFamilyId: string,
) {
	const uploadedMembers = await uploadMembers(file, churchId)

	await prisma.$transaction(async tx => {
		await prisma.honorFamily.update({
			where: { id: honorFamilyId },
			data: {
				members: {
					connect: uploadedMembers.map(member => ({ id: member.id })),
				},
			},
		})

		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'honorFamily',
			newMemberIds: [...uploadedMembers.map(m => m.id)],
			currentMemberIds: [],
		})
	})
}

export function formatAsSelectFieldsData(
	data: { id: string; name: string; isAdmin?: boolean }[],
) {
	return data.map(data => ({
		...data,
		label: data.name,
		value: data.id,
	}))
}

export async function getHonorFamily(id: string) {
	return await prisma.honorFamily.findFirst({
		where: { id },
		select: {
			id: true,
			name: true,
			manager: { select: { id: true, name: true } },
			_count: { select: { members: true } },
		},
	})
}

export async function getHonorFamilyMembers({
	honorFamilyId,
	filterData,
}: GetHonorFamilyMembersData) {
	const { take } = filterData

	const where = buildUserWhereInput({ honorFamilyId, filterData })

	const members = await prisma.user.findMany({
		where: where,
		select: {
			id: true,
			name: true,
			phone: true,
			isAdmin: true,
			createdAt: true,
			location: true,
			integrationDate: true,
		},
		take,
		orderBy: { name: 'asc' },
	})

	const count = await prisma.user.count({ where })

	return { members, count }
}

function buildUserWhereInput({
	honorFamilyId,
	filterData,
}: GetHonorFamilyMembersData): Prisma.UserWhereInput {
	const { from, to, query, status } = filterData
	const contains = `%${query.replace(/ /g, '%')}%`

	const dateConditions = getDateConditions(from, to, status)

	return {
		honorFamilyId,
		isActive: true,
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
		...dateConditions,
	} satisfies Prisma.UserWhereInput
}

function getDateConditions(
	from?: string,
	to?: string,
	status?: STATUS,
): Prisma.UserWhereInput {
	const oneMonthAgo = new Date()
	oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

	let dateConditions: Prisma.UserWhereInput = {}

	if (from && to) {
		const periodCondition = {
			createdAt: {
				gte: normalizeDate(new Date(from)),
				lt: normalizeDate(new Date(to), 'end'),
			},
		}

		if (!status || status === STATUS.ALL) {
			return periodCondition
		}

		dateConditions = {
			AND: [
				periodCondition,
				{
					createdAt: {
						...(status === STATUS.NEW
							? { gte: oneMonthAgo }
							: { lt: oneMonthAgo }),
					},
				},
			],
		}
	} else if (status && status !== STATUS.ALL) {
		dateConditions = {
			createdAt: {
				...(status === STATUS.NEW ? { gte: oneMonthAgo } : { lt: oneMonthAgo }),
			},
		}
	}

	return dateConditions
}

export async function getHonorFamilyAssistants({
	churchId,
	honorFamilyId,
	honorFamilyManagerId,
}: GetHonorFamilyAssistantsData) {
	return await prisma.user.findMany({
		where: {
			churchId,
			isActive: true,
			honorFamilyId: honorFamilyId,
			id: { not: honorFamilyManagerId },
			roles: { has: Role.HONOR_FAMILY_MANAGER },
		},
		select: {
			id: true,
			name: true,
			phone: true,
			isAdmin: true,
			integrationDate: true,
		},
		orderBy: { name: 'asc' },
	})
}

async function hashPassword(password: string) {
	const { ARGON_SECRET_KEY } = process.env
	invariant(ARGON_SECRET_KEY, 'ARGON_SECRET_KEY env var must be set')

	const hashedPassword = await hash(password, {
		secret: Buffer.from(ARGON_SECRET_KEY),
	})

	return hashedPassword
}

const isPhoneExists = async ({
	phone,
}: Partial<z.infer<typeof createMemberSchema>>) => {
	const field = await prisma.user.findFirst({
		where: { phone },
	})

	return !!field
}
