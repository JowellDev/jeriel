import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { commitSession, getSession } from '~/utils/session.server'
import { RESET_PASSWORD_SESSION_KEY } from './constants'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const session = await getSession(request.headers.get('cookie'))
	const email = session.get(RESET_PASSWORD_SESSION_KEY)

	if (!email || typeof email !== 'string') return redirect('/')

	return json(
		{ email },
		{ headers: { 'Set-Cookie': await commitSession(session) } },
	)
}

export type LoaderType = typeof loaderFn
