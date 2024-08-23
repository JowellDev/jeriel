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
	const { tribeId, departmentId, honorFamilyId, ...rest } = data

	console.log('payload ===========>', {
		...rest,
		roles: [Role.MEMBER],
		church: {
			connect: { id: churchId },
		},
		...(tribeId && { tribe: { connect: { id: tribeId } } }),
		...(departmentId && { department: { connect: { id: departmentId } } }),
		...(honorFamilyId && { honorFamily: { connect: { id: honorFamilyId } } }),
	})

	return prisma.user.create({
		data: {
			...rest,
			roles: [Role.MEMBER],
			church: { connect: { id: churchId } },
			...(tribeId && { tribe: { connect: { id: tribeId } } }),
			...(departmentId && { department: { connect: { id: departmentId } } }),
			...(honorFamilyId && { honorFamily: { connect: { id: honorFamilyId } } }),
		},
	})
}
