import { json, type ActionFunctionArgs } from '@remix-run/node'
import { attendanceMarkingSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: attendanceMarkingSchema,
	})

	console.log('submission =======>', submission)

	return json({})
}

export type ActionType = typeof action
