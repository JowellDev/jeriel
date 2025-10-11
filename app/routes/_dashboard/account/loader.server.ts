import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	return { currentUser }
}

export type LoaderType = typeof loaderFn
