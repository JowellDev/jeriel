import { type LoaderFunctionArgs } from '@remix-run/server-runtime'
import { requireAnonymous } from '~/utils/auth.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	await requireAnonymous(request)
	return null
}
