import { parseWithZod } from '@conform-to/zod'
import type { ActionFunctionArgs } from '@remix-run/node'
import { FormStrategy } from 'remix-auth-form'
import invariant from 'tiny-invariant'
import {
	authenticator,
	createUserSession,
	REDIRECT_AUTH,
	type AuthenticatedUser,
} from '~/utils/auth.server'
import { safeRedirect } from '~/utils/redirect'
import { schema } from './schema'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema })

	if (submission.status !== 'success') return submission.reply()

	const redirectTo = safeRedirect(submission.value?.redirectTo, REDIRECT_AUTH)

	try {
		const user = (await authenticator.authenticate(FormStrategy.name, request, {
			context: { formData },
			throwOnError: true,
		})) satisfies AuthenticatedUser | null

		invariant(user, 'User is required')

		return createUserSession({
			user,
			request,
			redirectTo,
			remember: !!submission.value.remember,
		} as const)
	} catch (e) {
		return submission.reply({
			formErrors: ['E-mail et/ou mot de passe invalide(s)'],
		} as const)
	}
}

export type ActionType = typeof actionFn
