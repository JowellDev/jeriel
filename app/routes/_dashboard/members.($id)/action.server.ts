import { parseWithZod } from '@conform-to/zod'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import { createMemberSchema } from './schema'
import { type z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { FORM_INTENT } from './constants'
import { prisma } from '~/utils/db.server'
import { Role } from '@prisma/client'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	const submission = parseWithZod(formData, {
		schema: createMemberSchema,
	})

	if (submission.status !== 'success')
		return json(
			{ submission: submission.reply(), success: false },
			{ status: 400 },
		)

	const data = submission.value

	if (intent === FORM_INTENT.CREATE) {
		await createMember(data, currentUser.id)

		return json(
			{ success: true, submission: submission.reply() },
			{ status: 200 },
		)
	}
}

async function createMember(
	data: z.infer<typeof createMemberSchema>,
	churchId: string,
) {
	return prisma.user.create({
		data: {
			phone: data.phone,
			roles: [Role.MEMBER],
			church: {
				connect: { id: churchId },
			},
		},
	})
}
