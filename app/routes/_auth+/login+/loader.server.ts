import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { getUserId } from '~/utils/auth.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const userId = await getUserId(request)
	if (userId) return redirect('/')
	return json({})
}
