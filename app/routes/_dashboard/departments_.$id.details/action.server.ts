import { parseWithZod } from '@conform-to/zod'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import { addAssistantSchema, createMemberSchema } from './schema'
import { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { FORM_INTENT } from './constants'
import { prisma } from '~/utils/db.server'
import { Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { uploadMembers } from '~/utils/member'
import { hash } from '@node-rs/argon2'

const isPhoneExists = async ({
	phone,
}: Partial<z.infer<typeof createMemberSchema>>) => {
	const field = await prisma.user.findFirst({
		where: { phone },
	})

	return !!field
}

const superRefineHandler = async (
	data: Partial<z.infer<typeof createMemberSchema>>,
	ctx: z.RefinementCtx,
) => {
	const isExists = await isPhoneExists(data)

	if (isExists) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['phone'],
			message: 'Numéro de téléphone déjà utilisé',
		})
	}
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const { id: departmentId } = params
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	const membersFile = formData.get('membersFile')

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(departmentId, 'departmentId is required')

	if (intent === FORM_INTENT.UPLOAD) {
		try {
			await uploadDepartmentMembers(
				membersFile as File,
				currentUser.churchId,
				departmentId,
			)
			return json({
				success: true,
				lastResult: null,
				message: 'Membres ajoutés avec succès',
			})
		} catch (error: any) {
			return json({
				lastResult: { error: error.message },
				success: false,
				message: null,
			})
		}
	}

	if (intent === FORM_INTENT.CREATE) {
		const submission = await parseWithZod(formData, {
			schema: createMemberSchema.superRefine((fields, ctx) =>
				superRefineHandler(fields, ctx),
			),
			async: true,
		})

		if (submission.status !== 'success')
			return json(
				{ lastResult: submission.reply(), success: false },
				{ status: 400 },
			)

		const data = submission.value
		await createMember(data, currentUser.churchId, departmentId)

		return json(
			{ success: true, lastResult: submission.reply() },
			{ status: 200 },
		)
	} else if (intent === FORM_INTENT.ADD_ASSISTANT) {
		const submission = await parseWithZod(formData, {
			schema: addAssistantSchema,
			async: true,
		})

		if (submission.status !== 'success')
			return json(
				{ lastResult: submission.reply(), success: false },
				{ status: 400 },
			)

		const data = submission.value
		await addAssistant(data, departmentId)

		return json(
			{ success: true, lastResult: submission.reply() },
			{ status: 200 },
		)
	}
}

export type ActionType = typeof actionFn

async function createMember(
	data: z.infer<typeof createMemberSchema>,
	churchId: string,
	departmentId: string,
) {
	return prisma.user.create({
		data: {
			...data,
			roles: [Role.MEMBER],
			church: { connect: { id: churchId } },
			department: { connect: { id: departmentId } },
			integrationDate: { create: { departementDate: new Date() } },
		},
	})
}

async function addAssistant(
	data: z.infer<typeof addAssistantSchema>,
	departmentId: string,
) {
	const { memberId, password } = data

	const member = await prisma.user.findFirst({
		where: { departmentId },
	})

	if (!member) {
		throw new Error('This member does not belongs to this department')
	}

	const hashedPassword = await hashPassword(password)

	return prisma.user.update({
		where: { id: memberId },
		data: {
			isAdmin: true,
			roles: { push: Role.DEPARTMENT_MANAGER },
			password: {
				create: {
					hash: hashedPassword,
				},
			},
			department: { connect: { id: departmentId } },
		},
	})
}

async function uploadDepartmentMembers(
	file: File,
	churchId: string,
	departmentId: string,
) {
	const uploadedMembers = await uploadMembers(file, churchId)

	await prisma.department.update({
		where: { id: departmentId },
		data: {
			members: {
				connect: uploadedMembers.map(member => ({ id: member.id })),
			},
		},
	})
}

export async function hashPassword(password: string) {
	const { ARGON_SECRET_KEY } = process.env
	invariant(ARGON_SECRET_KEY, 'ARGON_SECRET_KEY env var must be set')

	const hashedPassword = await hash(password, {
		secret: Buffer.from(ARGON_SECRET_KEY),
	})

	return hashedPassword
}
