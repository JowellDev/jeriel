import { parseWithZod } from '@conform-to/zod'
import { json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { prisma } from '~/utils/db.server'
import { commitSession, getSession } from '~/utils/session.server'
import { RESET_PASSWORD_SESSION_KEY } from './constants'
import { schema } from './schema'
import { SUCCESSFULL_RESET_PASSWORD_MESSAGE } from '../login+/constants'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema })

	if (submission.status !== 'success')
		return json(submission.reply(), { status: 400 })

	const { password } = submission.value
	const session = await getSession(request.headers.get('cookie'))
	const phone = session.get(RESET_PASSWORD_SESSION_KEY)

	if (!phone || typeof phone !== 'string') return redirect('/login')

	await prisma.user.resetPassword(phone, password)

	session.unset(RESET_PASSWORD_SESSION_KEY)
	session.flash(
		SUCCESSFULL_RESET_PASSWORD_MESSAGE,
		'Mot de passe modifié avec succès.',
	)

	return redirect('/login', {
		headers: {
			'Set-Cookie': await commitSession(session),
		},
	})
}

export type ActionType = typeof actionFn
