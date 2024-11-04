import { type ActionFunctionArgs, json } from '@remix-run/node'
import { createServiceSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import { requireUser } from '~/utils/auth.server'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	await requireUser(request)
	const formData = await request.formData()
	const schema = createServiceSchema

	const submission = parseWithZod(formData, { schema })

	console.log('submission ==========>', submission)

	if (submission.status !== 'success') {
		return json(
			{ success: false, lastResult: submission.reply() },
			{ status: 400 },
		)
	}

	return json(
		{ success: true, lastResult: submission.reply() },
		{ status: 200 },
	)
}

export type ActionType = typeof actionFn
