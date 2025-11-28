import { type LoaderFunctionArgs } from '@remix-run/node'
import { getSession } from '~/helpers/session'
import { SUCCESSFULL_RESET_PASSWORD_MESSAGE } from './constants'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const session = await getSession(request.headers.get('cookie'))
	const message =
		(session.get(SUCCESSFULL_RESET_PASSWORD_MESSAGE) as string) || null

	session.unset(SUCCESSFULL_RESET_PASSWORD_MESSAGE)

	return { message }
}

export type LoaderType = ReturnType<typeof loaderFn>
