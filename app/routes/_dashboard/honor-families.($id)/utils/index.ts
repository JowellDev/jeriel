import { z } from 'zod'
import { createHonorFamilySchema } from '../schema'
import { prisma } from '~/utils/db.server'

export function stringify(values: string[] | string): string {
	return JSON.stringify(values)
}

export const superRefineHandler = async (
	data: Partial<z.infer<typeof createHonorFamilySchema>>,
	ctx: z.RefinementCtx,
) => {
	const isExists = await isNameExists(data.name)

	if (isExists) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['name'],
			message: 'Ce nom est déjà utilisé',
		})
	}
}

const isNameExists = async (name?: string) => {
	const field = await prisma.honorFamily.findFirst({ where: { name } })

	return !!field
}
