import { parseWithZod } from '@conform-to/zod'
import type { User } from '@prisma/client'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import { FormStrategy } from 'remix-auth-form'
import invariant from 'tiny-invariant'
import { authenticator, createUserSession } from '~/utils/auth.server'
import { safeRedirect } from '~/utils/redirect'
import { schema } from './schema'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema })

	if (submission.status !== 'success')
		return json(submission.reply(), { status: 400 })

	const redirectTo = safeRedirect(submission.value?.redirectTo, '/')

	try {
		const user = (await authenticator.authenticate(FormStrategy.name, request, {
			context: { formData },
			throwOnError: true,
		})) satisfies User | null

		invariant(user, 'User is required')

		return createUserSession({
			redirectTo,
			request,
			remember: !!submission.value.remember,
			user,
		} as const)
	} catch (e) {
		return json(
			submission.reply({
				formErrors: ['Email et/ou mot de passe invalide(s)'],
			} as const),
			{ status: 400 },
		)
	}
}

export type ActionType = typeof actionFn
