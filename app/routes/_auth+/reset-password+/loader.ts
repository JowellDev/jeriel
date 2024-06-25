import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { requireAnonymous } from '~/utils/auth.server'
import { commitSession, getSession } from '~/utils/session.server'
import { RESET_PASSWORD_SESSION_KEY } from './constants'

const loader = async ({ request }: LoaderFunctionArgs) => {
	await requireAnonymous(request)

	const session = await getSession(request.headers.get('cookie'))
	const email = session.get(RESET_PASSWORD_SESSION_KEY)

	if (!email || typeof email !== 'string') return redirect('/')

	return json(
		{ email },
		{ headers: { 'Set-Cookie': await commitSession(session) } },
	)
}

export default loader
export type Loader = typeof loader
