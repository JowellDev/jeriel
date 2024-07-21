import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireAnonymous } from '~/utils/auth.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	await requireAnonymous(request)
	return null
}
