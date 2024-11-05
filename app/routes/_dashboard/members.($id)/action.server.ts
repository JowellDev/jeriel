import { parseWithZod } from '@conform-to/zod'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import { createMemberSchema, uploadMembersSchema } from './schema'
import { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { FORM_INTENT } from './constants'
import { prisma } from '~/utils/db.server'
import { Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { type MemberData, processExcelFile } from '~/utils/process-member-model'

const isPhoneExists = async (
	{ phone }: Partial<z.infer<typeof createMemberSchema>>,
	userId?: string,
) => {
	const field = await prisma.user.findFirst({
		where: { phone, id: { not: userId } },
	})

	return !!field
}

const superRefineHandler = async (
	data: Partial<z.infer<typeof createMemberSchema>>,
	ctx: z.RefinementCtx,
	userId?: string,
) => {
	const isExists = await isPhoneExists(data, userId)

	if (isExists) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['phone'],
			message: 'Numéro de téléphone déjà utilisé',
		})
	}
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const { id: memberId } = params
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(currentUser.churchId, 'Invalid churchId')

	if (intent === FORM_INTENT.UPLOAD)
		return uploadMembers(formData, currentUser.churchId)

	const submission = await parseWithZod(formData, {
		schema: createMemberSchema.superRefine((fields, ctx) =>
			superRefineHandler(fields, ctx, memberId),
		),
		async: true,
	})

	if (submission.status !== 'success')
		return json(
			{ lastResult: submission.reply(), success: false },
			{ status: 400 },
		)

	const data = submission.value

	if (intent === FORM_INTENT.CREATE) {
		await createMember(data, currentUser.churchId)
	}

	if (intent === FORM_INTENT.EDIT && memberId) {
		await updateMember(memberId, data)
	}

	return json(
		{ success: true, lastResult: submission.reply() },
		{ status: 200 },
	)
}

export type ActionType = typeof actionFn

async function createMember(
	data: z.infer<typeof createMemberSchema>,
	churchId: string,
) {
	const { tribeId, departmentId, honorFamilyId, ...rest } = data

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

async function updateMember(
	id: string,
	data: z.infer<typeof createMemberSchema>,
) {
	const { tribeId, departmentId, honorFamilyId, ...rest } = data

	return prisma.user.update({
		where: { id },
		data: {
			...rest,
			...(tribeId && { tribe: { connect: { id: tribeId } } }),
			...(departmentId && { department: { connect: { id: departmentId } } }),
			...(honorFamilyId && { honorFamily: { connect: { id: honorFamilyId } } }),
		},
	})
}
async function uploadMembers(formData: FormData, churchId: string) {
	const submission = parseWithZod(formData, { schema: uploadMembersSchema })

	if (submission.status !== 'success')
		return json(
			{ lastResult: submission.reply(), success: false },
			{ status: 400 },
		)

	try {
		const { data: members, errors } = await processExcelFile(
			submission.value.file as File,
		)

		if (errors.length) throw new Error('Données invalides', { cause: errors })

		await upsertMembers(members, churchId)

		return json(
			{ success: true, lastResult: submission.reply() },
			{ status: 200 },
		)
	} catch (error: any) {
		return json(
			{
				lastResult: submission.reply(),
				success: false,
				error: 'Fichier invalide ! Veuillez télécharger le modèle.',
			},
			{ status: 400 },
		)
	}
}

async function upsertMembers(members: MemberData[], churchId: string) {
	for (const member of members) {
		const { phone, name, location } = member

		await prisma.user.upsert({
			where: { phone },
			update: { name, location },
			create: {
				...member,
				church: { connect: { id: churchId } },
				roles: { set: [Role.MEMBER] },
			},
		})
	}
}
