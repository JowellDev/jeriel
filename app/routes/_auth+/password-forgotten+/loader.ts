import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireAnonymous } from '~/utils/auth.server'

export default async ({ request }: LoaderFunctionArgs) => {
	await requireAnonymous(request)

	return json({})
}
