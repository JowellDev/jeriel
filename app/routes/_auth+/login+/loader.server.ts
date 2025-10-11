import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { commitSession, getSession } from '~/utils/session.server'
import { SUCCESSFULL_RESET_PASSWORD_MESSAGE } from './constants'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const session = await getSession(request.headers.get('cookie'))
	const message =
		(session.get(SUCCESSFULL_RESET_PASSWORD_MESSAGE) as string) || null

	return json(
		{ message },
		{ headers: { 'Set-Cookie': await commitSession(session) } },
	)
}

export type LoaderType = typeof loaderFn
