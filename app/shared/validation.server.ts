import { z } from 'zod'
import { prisma } from '~/infrastructures/database/prisma.server'

export async function checkEmailUniqueness(
	email: string | undefined,
	excludeId?: string,
): Promise<boolean> {
	if (!email) return false

	const existing = await prisma.user.findFirst({
		where: { email, id: { not: excludeId } },
	})

	return !!existing
}

export async function addEmailUniquenessIssue(
	data: { email?: string },
	ctx: z.RefinementCtx,
	excludeId?: string,
) {
	const isTaken = await checkEmailUniqueness(data.email, excludeId)
	if (isTaken) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['email'],
			message: 'Adresse email déjà utilisée',
		})
	}
}
