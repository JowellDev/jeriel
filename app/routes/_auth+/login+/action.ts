import { parse } from '@conform-to/zod'
import type { User } from '@prisma/client'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import { FormStrategy } from 'remix-auth-form'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { authenticator, createUserSession } from '~/utils/auth.server'

import { safeRedirect } from '~/utils/redirect'

export const schema = z.object({
	email: z
		.string({ required_error: 'You must enter an e-mail address' })
		.email('You must enter a valid mail address'),
	password: z.string({ required_error: 'You must enter a password' }),
	redirectTo: z.string({ required_error: 'Redirect URL is required' }),
	remember: z.boolean().optional(),
})

const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()
	const submission = parse(formData, { schema })

	const redirectTo = safeRedirect(submission.value?.redirectTo, '/')

	if (!submission.value || submission.intent !== 'submit')
		return json(
			{
				...submission,
				payload: { ...submission.payload, redirectTo },
			} as const,
			{ status: 400 },
		)

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
			{
				...submission,
				error: { '': ['Invalid email/password'] },
			} as const,
			{ status: 400 },
		)
	}
}

export default action
export type Action = typeof action
