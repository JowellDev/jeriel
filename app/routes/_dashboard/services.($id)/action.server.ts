import { type ActionFunctionArgs, json } from '@remix-run/node'
import { schema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import { requireUser } from '~/utils/auth.server'
import { type z, type RefinementCtx } from 'zod'
import { FORM_INTENT } from './constants'
import { prisma } from '~/utils/db.server'

const superRefineHandler = async (
	fields: z.infer<typeof schema>,
	ctx: RefinementCtx,
	serviceId?: string,
) => {}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	await requireUser(request)

	const { id } = params
	const formData = await request.formData()
	const intent = formData.get('intent')

	const submission = parseWithZod(formData, {
		schema: schema.superRefine((data, ctx) => {
			superRefineHandler(data, ctx, id)
		}),
	})

	if (submission.status !== 'success') {
		return json(
			{ success: false, lastResult: submission.reply() },
			{ status: 400 },
		)
	}

	const { value } = submission

	if (intent === FORM_INTENT.CREATE) {
		await createService(value)
	}

	if (intent === FORM_INTENT.UPDATE && id) {
		await updateService(id, value)
	}

	return json(
		{ success: true, lastResult: submission.reply() },
		{ status: 200 },
	)
}

export type ActionType = typeof actionFn

async function createService(data: z.infer<typeof schema>) {
	const { departmentId, tribeId, from, to } = data

	return prisma.service.create({
		data: {
			from: new Date(from),
			to: new Date(to),
			...(tribeId && {
				tribe: {
					connect: { id: tribeId },
				},
			}),
			...(departmentId && {
				department: {
					connect: { id: departmentId },
				},
			}),
		},
	})
}

async function updateService(id: string, { from, to }: z.infer<typeof schema>) {
	return prisma.service.update({
		where: { id },
		data: {
			from: new Date(from),
			to: new Date(to),
		},
	})
}
