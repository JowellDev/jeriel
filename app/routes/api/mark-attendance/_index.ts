import { json, type ActionFunctionArgs } from '@remix-run/node'
import { attendanceMarkingSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: attendanceMarkingSchema,
	})

	if (submission.status !== 'success')
		return json(
			{ submission: submission.reply(), success: false },
			{ status: 400 },
		)

	const { attendances } = submission.value

	const parsedAttendances = JSON.parse(attendances as string)

	console.log('parsedAttendances =======>', parsedAttendances)

	return json({ submission: submission.reply(), success: true })
}

export type MarkAttendanceActionType = typeof action
