import { type ActionFunctionArgs, json } from '@remix-run/node'
import { createServiceSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import { requireUser } from '~/utils/auth.server'
import { type z, type RefinementCtx } from 'zod'
import { FORM_INTENT } from './constants'
import { prisma } from '~/utils/db.server'

const superRefineHandler = async (
	fields: z.infer<typeof createServiceSchema>,
	ctx: RefinementCtx,
	id?: string,
) => {}

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	const schema = createServiceSchema

	const submission = parseWithZod(formData, {
		schema: schema.superRefine((data, ctx) => {
			superRefineHandler(data, ctx)
		}),
	})

	if (submission.status !== 'success') {
		return json(
			{ success: false, lastResult: submission.reply() },
			{ status: 400 },
		)
	}

	const { value } = submission

	console.log('value ======>', value)

	if (intent === FORM_INTENT.CREATE) {
		await createService(value)
	}

	return json(
		{ success: true, lastResult: submission.reply() },
		{ status: 200 },
	)
}

export type ActionType = typeof actionFn

async function createService(data: z.infer<typeof createServiceSchema>) {
	const { departmentId, tribeId, from, to } = data

	await prisma.service.create({
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
