import { parseWithZod } from '@conform-to/zod'
import { json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { prisma } from '~/utils/db.server'
import { commitSession, getSession } from '~/utils/session.server'
import { RESET_PASSWORD_SESSION_KEY } from './constants'
import { schema } from './schema'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema })

	if (submission.status !== 'success')
		return json(submission.reply(), { status: 400 })

	const { password } = submission.value
	const session = await getSession(request.headers.get('cookie'))
	const email = session.get(RESET_PASSWORD_SESSION_KEY)

	if (!email || typeof email !== 'string') return redirect('/login')

	await prisma.user.resetPassword(email, password)
	session.unset(RESET_PASSWORD_SESSION_KEY)

	return redirect('/login', {
		headers: {
			'Set-Cookie': await commitSession(session),
		},
	})
}

export type ActionType = typeof actionFn
