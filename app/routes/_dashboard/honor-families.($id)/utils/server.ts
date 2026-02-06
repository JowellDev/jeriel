import { z } from 'zod'
import type { createHonorFamilySchema } from '../schema'
import { prisma } from '~/infrastructures/database/prisma.server'
import { PWD_ERROR_MESSAGE, PWD_REGEX } from '~/shared/constants'
import type { Prisma } from '@prisma/client'
import { Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { hash } from '@node-rs/argon2'

export const superRefineHandler = async (
	data: z.infer<typeof createHonorFamilySchema>,
	ctx: z.RefinementCtx,
	honorFamilyId?: string,
) => {
	const isNameExist = await isNameExists(data.name, honorFamilyId)
	const isAdmin = await isManagerAdmin(data.managerId)

	const addCustomIssue = (path: (string | number)[], message: string) => {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path,
			message,
		})
	}

	if (isNameExist) {
		addCustomIssue(['name'], 'Ce nom est déjà utilisé.')
	}

	// Vérifier l'unicité de l'email du manager
	if (data.managerEmail) {
		const existingUserWithEmail = await prisma.user.findFirst({
			where: {
				email: data.managerEmail,
				id: { not: data.managerId },
			},
		})

		if (existingUserWithEmail) {
			addCustomIssue(['managerEmail'], 'Cette adresse email est déjà utilisée.')
		}
	}

	if (!isAdmin) {
		if (!data.password) {
			addCustomIssue(['password'], 'Le mot de passe est requis')
		}

		if (data.password && data.password?.length < 8)
			addCustomIssue(['password'], PWD_ERROR_MESSAGE.min)

		if (!data.password?.match(PWD_REGEX)) {
			addCustomIssue(['password'], PWD_ERROR_MESSAGE.invalid)
		}
	}
}

const isNameExists = async (name?: string, honorFamilyId?: string) => {
	const field = await prisma.honorFamily.findFirst({
		where: { name, NOT: { id: honorFamilyId } },
		select: { id: true },
	})

	return !!field
}

const isManagerAdmin = async (id: string) => {
	const user = await prisma.user.findFirst({
		where: { id },
		select: { isAdmin: true },
	})

	return !!user?.isAdmin
}

export async function selectedMembersId(membersId?: string[]) {
	if (membersId && membersId.length > 0) {
		return (
			await prisma.user.findMany({
				where: { id: { in: membersId } },
				select: { id: true },
			})
		).map(u => u.id)
	}

	return []
}

export async function updateManagerPassword({
	honorFamilyId,
	managerId,
	password,
	tx,
}: {
	honorFamilyId: string
	managerId: string
	password: string
	tx: Prisma.TransactionClient
}) {
	const hashedPassword = await hashPassword(password)

	await tx.user.update({
		where: { id: managerId },
		data: {
			isAdmin: true,
			roles: { push: Role.HONOR_FAMILY_MANAGER },
			honorFamily: {
				connect: { id: honorFamilyId },
			},
			password: {
				create: {
					hash: hashedPassword,
				},
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

export function buildHonorFamilyWhere(query: string, churchId: string) {
	const contains = `%${query.replace(/ /g, '%')}%`

	return {
		churchId,
		OR: [
			{ name: { contains, mode: 'insensitive' } },
			{ manager: { name: { contains, mode: 'insensitive' } } },
			{ manager: { phone: { contains, mode: 'insensitive' } } },
		],
	} satisfies Prisma.HonorFamilyWhereInput
}
