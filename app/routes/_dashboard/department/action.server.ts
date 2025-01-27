import { json, type ActionFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import { attendanceMarkingSchema } from '~/routes/api/mark-attendance/schema'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: attendanceMarkingSchema,
	})

	console.log('submission =======>', submission)

	return json({})
}

export type ActionType = typeof actionFn
