import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const user = await requireUser(request)

	const currentUrl = new URL(request.url)

	if (currentUrl.pathname !== '/dashboard') return redirect('/dashboard')

	return { user }
}
