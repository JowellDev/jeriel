import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { addAssistantSchema } from '../schema'
import { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { FORM_INTENT } from '../constants'
import { prisma } from '~/utils/db.server'
import { type Prisma, Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { uploadMembers } from '~/utils/member'
import { hash } from '@node-rs/argon2'
import { updateIntegrationDates } from '~/utils/integration.utils'
import { saveMemberPicture } from '~/utils/member-picture.server'
import { createEntityMemberSchema } from '~/shared/schema'

const isEmailExists = async ({
	email,
}: Partial<z.infer<typeof createEntityMemberSchema>>) => {
	const field = await prisma.user.findFirst({
		where: { email },
	})

	return !!field
}

const superRefineHandler = async (
	data: Partial<z.infer<typeof createEntityMemberSchema>>,
	ctx: z.RefinementCtx,
) => {
	const isExists = await isEmailExists(data)

	if (isExists) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['email'],
			message: 'Adresse email déjà utilisée',
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

			return { status: 'success' }
		} catch (error: any) {
			return {
				status: 'error',
				message: error.message,
			}
		}
	}

	if (intent === FORM_INTENT.CREATE) {
		const submission = await parseWithZod(formData, {
			schema: createEntityMemberSchema.superRefine((fields, ctx) =>
				superRefineHandler(fields, ctx),
			),
			async: true,
		})

		if (submission.status !== 'success') return submission.reply()

		const { value } = submission

		await createMember(value, currentUser.churchId, departmentId)

		return { status: 'success' }
	}

	if (intent === FORM_INTENT.ADD_ASSISTANT) {
		const submission = await parseWithZod(formData, {
			schema: addAssistantSchema,
			async: true,
		})

		if (submission.status !== 'success') return submission.reply()

		const { value } = submission

		await addAssistant(value, departmentId)

		return { status: 'success' }
	}

	return { status: 'success' }
}

export type ActionType = typeof actionFn

async function createMember(
	data: z.infer<typeof createEntityMemberSchema>,
	churchId: string,
	departmentId: string,
) {
	const { picture, ...rest } = data
	const pictureUrl = picture ? await saveMemberPicture(picture) : null

	return prisma.user.create({
		data: {
			...rest,
			...(pictureUrl && { pictureUrl }),
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
	await prisma.$transaction(async tx => {
		await prisma.department.update({
			where: { id: departmentId },
			data: {
				members: {
					connect: uploadedMembers.map(member => ({ id: member.id })),
				},
			},
		})

		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'department',
			newMemberIds: [...uploadedMembers.map(m => m.id)],
			currentMemberIds: [],
		})
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
