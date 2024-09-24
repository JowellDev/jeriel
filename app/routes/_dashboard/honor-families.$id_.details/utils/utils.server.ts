import { z } from 'zod'
import type { addAssistantSchema, createMemberSchema } from '../schema'
import { prisma } from '~/utils/db.server'
import invariant from 'tiny-invariant'
import type { Prisma } from '@prisma/client'
import { Role } from '@prisma/client'
import { uploadMembers } from '~/utils/member'
import { hash } from '@node-rs/argon2'

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

	await prisma.honorFamily.update({
		where: { id: honorFamilyId },
		data: {
			members: {
				connect: uploadedMembers.map(member => ({ id: member.id })),
			},
		},
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
