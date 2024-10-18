import { parseWithZod } from '@conform-to/zod'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { filterSchema } from './schema'
import invariant from 'tiny-invariant'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	await requireUser(request)

	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const { value: filterData } = submission

	return json({ filterData })
}

export type LoaderType = typeof loaderFn
