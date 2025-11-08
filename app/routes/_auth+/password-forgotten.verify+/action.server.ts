import { parseWithZod } from '@conform-to/zod'
import { json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { prisma } from '~/utils/db.server'
import { commitSession, getSession } from '~/utils/session.server'
import { RESET_PASSWORD_SESSION_KEY } from '../reset-password+/constants'
import { refinedSchema } from './schema'
import { VERIFY_EMAIL_SESSION_KEY } from './constants'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()
	return validate(request, formData)
}

export async function validate(
	request: Request,
	formData: FormData | URLSearchParams,
) {
	const submission = await parseWithZod(formData, {
		schema: refinedSchema,
		async: true,
	})

	if (submission.status !== 'success')
		return json(submission.reply(), { status: 400 })

	const { email } = submission.value

	await prisma.verification.deleteMany({ where: { email } })

	const session = await getSession(request.headers.get('Cookie'))
	session.unset(VERIFY_EMAIL_SESSION_KEY)
	session.set(RESET_PASSWORD_SESSION_KEY, email)

	return redirect('/reset-password', {
		headers: { 'Set-Cookie': await commitSession(session) },
	})
}

export type ActionType = typeof actionFn
