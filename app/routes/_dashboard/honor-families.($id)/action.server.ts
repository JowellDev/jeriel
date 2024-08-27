import { json, type ActionFunctionArgs } from '@remix-run/node'
import { createHonorFamilySchema } from './schema'
import { requireUser } from '~/utils/auth.server'
import invariant from 'tiny-invariant'
import { parseWithZod } from '@conform-to/zod'
import { FORM_INTENT } from './constants'
import { type z } from 'zod'
import { prisma } from '~/utils/db.server'
import { superRefineHandler } from './utils'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const { churchId } = await requireUser(request)
	invariant(churchId, 'Invalid churchId')

	const formData = await request.formData()
	const intent = formData.get('intent')

	const submission = await parseWithZod(formData, {
		schema: createHonorFamilySchema.superRefine((fields, ctx) =>
			superRefineHandler(fields, ctx),
		),
		async: true,
	})

	if (submission.status !== 'success')
		return json(
			{ lastResult: submission.reply(), success: false },
			{ status: 400 },
		)

	if (intent === FORM_INTENT.CREATE) {
		await createHonorFamily(submission.value, churchId)

		return json(
			{ success: true, lastResult: submission.reply() },
			{ status: 200 },
		)
	}
}

async function createHonorFamily(
	data: z.infer<typeof createHonorFamilySchema>,
	churchId: string,
) {
	const admin = await prisma.user.findFirst({
		where: { id: data.adminId },
		select: { phone: true },
	})

	invariant(admin, 'No user with this id')

	await prisma.user.resetPassword(admin.phone, data.password)

	await prisma.honorFamily.create({
		data: {
			name: data.name,
			churchId,
			adminId: data.adminId,
			members: { connect: data.members?.map(m => ({ id: m })) },
		},
	})
}

export type ActionData = typeof actionFn
