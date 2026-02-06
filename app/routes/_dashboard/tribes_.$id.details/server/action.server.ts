import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { addTribeAssistantSchema, uploadMemberSchema } from '../schema'
import { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { FORM_INTENT } from '../constants'
import { prisma } from '~/infrastructures/database/prisma.server'
import { type Prisma, Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { uploadMembers } from '~/utils/member'
import { hash } from '@node-rs/argon2'
import { updateIntegrationDates } from '~/helpers/integration.server'
import { createEntityMemberSchema } from '~/shared/schema'
import { saveMemberPicture } from '~/helpers/member-picture.server'
import type { ExportMembersPayload } from '../types'
import {
	createExportTribeMembersFile,
	getExportTribeMembers,
	getTribeName,
	getUrlParams,
} from '../utils/utils.server'

const isEmailExists = async (
	{ email }: Partial<z.infer<typeof createEntityMemberSchema>>,
	userId?: string,
) => {
	if (!email) return false

	const field = await prisma.user.findFirst({
		where: { email, id: { not: userId } },
	})

	return !!field
}

const superRefineHandler = async (
	data: Partial<z.infer<typeof createEntityMemberSchema>>,
	ctx: z.RefinementCtx,
	userId?: string,
) => {
	const isExists = await isEmailExists(data, userId)

	if (isExists) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['email'],
			message: 'Adresse email déjà utilisée',
		})
	}
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const { id: tribeId } = params
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(tribeId, 'tribeId is required')

	if (intent === FORM_INTENT.EXPORT) {
		return exportMembers({
			request,
			customerName: currentUser.name,
			tribeId,
		})
	}

	if (intent === FORM_INTENT.UPLOAD) {
		return handleUploadMembersAction(formData, currentUser.churchId, tribeId)
	}

	if (intent === FORM_INTENT.CREATE) {
		return handleCreateMemberAction(formData, currentUser.churchId, tribeId)
	}

	if (intent === FORM_INTENT.ADD_ASSISTANT) {
		return handleAddAssistantAction(formData, tribeId)
	}

	return { status: 'success' }
}

export type ActionType = typeof actionFn

async function handleCreateMemberAction(
	formData: FormData,
	churchId: string,
	tribeId: string,
) {
	const submission = await parseWithZod(formData, {
		schema: createEntityMemberSchema.superRefine((fields, ctx) =>
			superRefineHandler(fields, ctx),
		),
		async: true,
	})

	if (submission.status !== 'success') return submission.reply()

	const { value } = submission
	const { picture, ...rest } = value

	const pictureUrl = picture ? await saveMemberPicture(picture) : null

	await prisma.user.create({
		data: {
			...rest,
			...(pictureUrl && { pictureUrl }),
			roles: [Role.MEMBER],
			church: { connect: { id: churchId } },
			tribe: { connect: { id: tribeId } },
			integrationDate: { create: { tribeDate: new Date() } },
		},
	})

	return { status: 'success' }
}

async function handleAddAssistantAction(formData: FormData, tribeId: string) {
	const submission = await parseWithZod(formData, {
		schema: addTribeAssistantSchema,
		async: true,
	})

	if (submission.status !== 'success') return submission.reply()

	const { value } = submission

	await addTribeAssistant(value, tribeId)

	return { status: 'success' }
}

async function addTribeAssistant(
	data: z.infer<typeof addTribeAssistantSchema>,
	tribeId: string,
) {
	const { memberId, email, password } = data

	const member = await prisma.user.findUnique({
		where: { id: memberId },
		select: { roles: true },
	})

	if (!member) throw new Error('Member not found')

	const updatedRoles = [...member.roles]
	if (!updatedRoles.includes(Role.TRIBE_MANAGER)) {
		updatedRoles.push(Role.TRIBE_MANAGER)
	}

	return prisma.user.update({
		where: { id: memberId },
		data: {
			isAdmin: true,
			roles: updatedRoles,
			tribe: { connect: { id: tribeId } },
			...(email && { email }),
			...(password && {
				password: {
					create: {
						hash: await hashPassword(password),
					},
				},
			}),
		},
	})
}

async function handleUploadMembersAction(
	formData: FormData,
	churchId: string,
	tribeId: string,
) {
	const submission = await parseWithZod(formData, {
		schema: uploadMemberSchema,
		async: true,
	})

	if (submission.status !== 'success') return submission.reply()

	const { file } = submission.value

	try {
		await uploadTribeMembers(file, churchId, tribeId)

		return { status: 'success' }
	} catch (error: any) {
		return { ...submission.reply(), status: 'error', error: error.cause }
	}
}

async function exportMembers({
	request,
	customerName,
	tribeId,
}: ExportMembersPayload) {
	const filterData = getUrlParams(request)
	const tribe = await getTribeName(tribeId)

	const members = await getExportTribeMembers({
		id: tribeId,
		filterData,
	})

	const fileName = `Membres de la tribu ${tribe?.name}`

	const fileLink = await createExportTribeMembersFile({
		fileName,
		members,
		customerName,
	})

	return { status: 'success', fileLink }
}

async function uploadTribeMembers(
	file: File,
	churchId: string,
	tribeId: string,
) {
	const uploadedMembers = await uploadMembers(file, churchId)

	await prisma.$transaction(async tx => {
		await prisma.tribe.update({
			where: { id: tribeId },
			data: {
				members: {
					connect: uploadedMembers.map(member => ({ id: member.id })),
				},
			},
		})

		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'tribe',
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
