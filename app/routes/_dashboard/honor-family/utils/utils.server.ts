import { z } from 'zod'
import {
	paramsSchema,
	type addAssistantSchema,
	type createMemberSchema,
} from '../schema'
import { prisma } from '~/infrastructures/database/prisma.server'
import invariant from 'tiny-invariant'
import type { Prisma } from '@prisma/client'
import { Role } from '@prisma/client'
import { uploadMembers } from '~/helpers/member-upload.server'
import type {
	GetHonorFamilyMembersData,
	GetHonorFamilyAssistantsData,
	MemberFilterOptions,
} from '../types'
import { normalizeDate } from '~/utils/date'
import { FilterStatus } from '~/shared/enum'
import {
	fetchEntityMemberIds,
	updateIntegrationDates,
	hashPassword,
} from '~/helpers/integration.server'
import { parseWithZod } from '@conform-to/zod'
import type { Member } from '~/models/member.model'

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

async function fetchMemberForHonorFamilyAssistant(
	memberId: string,
	honorFamilyId: string,
) {
	const member = await prisma.user.findUnique({
		where: { id: memberId },
		select: { id: true, roles: true, honorFamilyId: true },
	})
	if (!member || member.honorFamilyId !== honorFamilyId)
		throw new Error('This member does not belong to this honor family')

	return member
}

function buildRolesWithHonorFamilyManager(currentRoles: Role[]): Role[] {
	if (currentRoles.includes(Role.HONOR_FAMILY_MANAGER)) return currentRoles
	return [...currentRoles, Role.HONOR_FAMILY_MANAGER]
}

async function buildAssistantPasswordUpdate(
	memberId: string,
	password: string | undefined,
) {
	if (!password) return {}

	const hashedPassword = await hashPassword(password)

	return {
		password: {
			upsert: {
				where: { userId: memberId },
				create: { hash: hashedPassword },
				update: { hash: hashedPassword },
			},
		},
	}
}

export async function addAssistantToHonorFamily(
	data: z.infer<typeof addAssistantSchema>,
	honorFamilyId: string,
) {
	const { memberId, password } = data
	const member = await fetchMemberForHonorFamilyAssistant(
		memberId,
		honorFamilyId,
	)
	const updatedRoles = buildRolesWithHonorFamilyManager(member.roles)
	const passwordUpdate = await buildAssistantPasswordUpdate(memberId, password)
	return prisma.user.update({
		where: { id: memberId },
		data: {
			isAdmin: true,
			roles: updatedRoles,
			honorFamily: { connect: { id: honorFamilyId } },
			...passwordUpdate,
		},
	})
}

export async function uploadHonorFamilyMembers(
	file: File,
	churchId: string,
	honorFamilyId: string,
) {
	const [uploadedMembers, currentMemberIds] = await Promise.all([
		uploadMembers(file, churchId),
		fetchEntityMemberIds('honorFamily', honorFamilyId),
	])

	const newMemberIds = uploadedMembers.map(m => m.id)

	await prisma.$transaction(async tx => {
		await tx.honorFamily.update({
			where: { id: honorFamilyId },
			data: { members: { connect: newMemberIds.map(id => ({ id })) } },
		})

		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'honorFamily',
			newMemberIds,
			currentMemberIds,
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
		},
	})
}

export async function getHonorFamilyMembers({
	id,
	filterData,
}: GetHonorFamilyMembersData) {
	const { take } = filterData

	const where = buildUserWhereInput({ id, filterData })

	const members = await prisma.user.findMany({
		where: where,
		select: {
			id: true,
			name: true,
			phone: true,
			email: true,
			isAdmin: true,
			createdAt: true,
			location: true,
			gender: true,
			birthday: true,
			maritalStatus: true,
			integrationDate: true,
			pictureUrl: true,
		},
		take,
		orderBy: { name: 'asc' },
	})

	const count = await prisma.user.count({ where })

	return { members, count }
}

function buildUserWhereInput({
	id,
	filterData,
}: GetHonorFamilyMembersData): Prisma.UserWhereInput {
	const contains = `%${filterData.query.replace(/ /g, '%')}%`

	const dateConditions = getDateFilterOptions(filterData)

	return {
		honorFamilyId: id,
		isActive: true,
		deletedAt: null,
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
		...dateConditions,
	} satisfies Prisma.UserWhereInput
}

export async function getHonorFamilyAssistants({
	churchId,
	id,
	managerId,
}: GetHonorFamilyAssistantsData) {
	return await prisma.user.findMany({
		where: {
			churchId,
			isActive: true,
			deletedAt: null,
			honorFamilyId: id,
			id: { not: managerId },
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

const isPhoneExists = async ({
	phone,
}: Partial<z.infer<typeof createMemberSchema>>) => {
	const field = await prisma.user.findFirst({
		where: { phone },
	})

	return !!field
}

export function getUrlParams(request: Request) {
	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, {
		schema: paramsSchema,
	})

	invariant(submission.status === 'success', 'invalid criteria')

	return submission.value
}

export async function getHonorFamilyName(id: string) {
	return await prisma.honorFamily.findFirst({
		where: { id },
		select: { name: true },
	})
}

export async function getExportHonorFamilyMembers({
	id,
	filterData,
}: GetHonorFamilyMembersData): Promise<Member[]> {
	const where = buildUserWhereInput({ id, filterData })

	return prisma.user.findMany({
		where,
		select: {
			id: true,
			integrationDate: true,
			name: true,
			email: true,
			phone: true,
			location: true,
			createdAt: true,
			birthday: true,
			gender: true,
			maritalStatus: true,
			pictureUrl: true,
		},
		orderBy: { name: 'asc' },
	})
}

function getDateFilterOptions(options: MemberFilterOptions) {
	const { status, to, from } = options

	const isAll = status === 'ALL'
	const statusEnabled = !!status && !isAll
	const isNew = status === FilterStatus.NEW

	const startDate = normalizeDate(new Date(from), 'start')
	const endDate = normalizeDate(new Date(to), 'end')

	return {
		...(!statusEnabled && { createdAt: { lte: endDate } }),
		...(statusEnabled
			? {
					createdAt: isNew
						? { gte: startDate, lte: endDate }
						: { lte: startDate },
				}
			: { createdAt: { lte: endDate } }),
	}
}
