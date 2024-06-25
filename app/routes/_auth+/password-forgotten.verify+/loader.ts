import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireAnonymous } from '~/utils/auth.server'
import { validate } from './action'

const loader = async ({ request }: LoaderFunctionArgs) => {
	await requireAnonymous(request)

	const searchParams = new URL(request.url).searchParams

	if (!searchParams.has('otp')) {
		// We don't want to show error if otp is not prefilled,
		// typically if user did not used the reset link
		return json({
			submission: {
				intent: '',
				payload: Object.fromEntries(searchParams),
				error: {},
			},
		} as const)
	}

	return validate(request, searchParams)
}

export default loader
export type Loader = typeof loader
