import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { commitSession, getSession } from '~/utils/session.server'
import { VERIFY_PHONE_SESSION_KEY } from './constants'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const session = await getSession(request.headers.get('cookie'))
	const phone = session.get(VERIFY_PHONE_SESSION_KEY)

	if (!phone || typeof phone !== 'string') return redirect('/')

	return json(
		{ phone },
		{ headers: { 'Set-Cookie': await commitSession(session) } },
	)
}

export type LoaderType = typeof loaderFn
