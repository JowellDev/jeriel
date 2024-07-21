import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { validate } from './action.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const searchParams = new URL(request.url).searchParams

	if (!searchParams.has('otp')) {
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

export type LoaderType = typeof loaderFn
