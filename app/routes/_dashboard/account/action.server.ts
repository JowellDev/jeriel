import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { schema } from './schema'
import { z } from 'zod'
import invariant from 'tiny-invariant'
import { verify } from '@node-rs/argon2'
import { prisma } from '~/infrastructures/database/prisma.server'
import { requireUser } from '~/utils/auth.server'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)

	const submission = await parseWithZod(await request.formData(), {
		schema: schema.superRefine(async ({ currentPassword }, ctx) => {
			const [userPassword] = await prisma.password.findMany({
				where: { userId: currentUser.id },
			})

			const isMatch = await verifyPassword(currentPassword, userPassword?.hash)

			if (!isMatch) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['currentPassword'],
					message: 'Mot de passe incorrecte',
				})
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') return submission.reply()

	if (currentUser.email) {
		await prisma.user.resetPassword(
			currentUser.email,
			submission.value.newPassword,
		)
	}

	return { status: 'success' }
}

function verifyPassword(password: string, hash: string) {
	const ARGON_SECRET_KEY = process.env.ARGON_SECRET_KEY
	invariant(ARGON_SECRET_KEY, 'ARGON_SECRET_KEY env var must be set')

	return verify(hash, password, {
		secret: Buffer.from(ARGON_SECRET_KEY),
	})
}

export type ActionType = typeof actionFn
