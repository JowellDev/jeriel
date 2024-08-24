import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	await requireUser(request)

	return json({ data: {} })
}

export type loaderData = typeof loaderFn
