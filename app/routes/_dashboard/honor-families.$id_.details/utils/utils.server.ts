import { z } from 'zod'
import { addAssistantSchema, createMemberSchema } from '../schema'
import { prisma } from '~/utils/db.server'
import invariant from 'tiny-invariant'
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

	const hashedPassword = await hashPassword(password)

	return prisma.user.update({
		where: { id: memberId },
		data: {
			isAdmin: true,
			roles: { push: Role.HONOR_FAMILY_MANAGER },
			password: {
				upsert: {
					create: {
						hash: hashedPassword,
					},
					update: {
						hash: hashedPassword,
					},
				},
			},
			honorFamily: { connect: { id: honorFamilyId } },
		},
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
