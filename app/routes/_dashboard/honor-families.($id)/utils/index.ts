import { z } from 'zod'
import { createHonorFamilySchema } from '../schema'
import { prisma } from '~/utils/db.server'
import { PWD_REGEX } from '~/shared/constants'

export function stringify(values: string[] | string): string {
	return JSON.stringify(values)
}

export const superRefineHandler = async (
	data: z.infer<typeof createHonorFamilySchema>,
	ctx: z.RefinementCtx,
) => {
	const isNameExist = await isNameExists(data.name)
	const isAdmin = await isManagerAdmin(data.managerId)

	const addCustomIssue = (path: (string | number)[], message: string) => {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path,
			message,
		})
	}

	if (isNameExist) {
		addCustomIssue(['name'], 'Ce nom est déjà utilisé 😭')
	}

	if (!isAdmin) {
		if (!data.password) {
			addCustomIssue(['password'], 'Le mot de passe est requis')
		}

		if (data.password && data.password?.length < 8)
			addCustomIssue(
				['password'],
				'Le mot de passe doit contenir au moins 8 caractères',
			)

		if (!data.password?.match(PWD_REGEX)) {
			addCustomIssue(
				['password'],
				'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spéciaux',
			)
		}
	}
}

const isNameExists = async (name?: string) => {
	const field = await prisma.honorFamily.findFirst({
		where: { name },
		select: { id: true },
	})

	return !!field
}

const isManagerAdmin = async (id: string) => {
	const user = await prisma.user.findFirst({
		where: { id },
		select: { isAdmin: true },
	})

	return user?.isAdmin === true
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
