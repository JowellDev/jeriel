import { parseWithZod } from '@conform-to/zod'
import { data, type ActionFunctionArgs } from '@remix-run/node'
import { addTribeAssistantSchema, uploadMemberSchema } from './schema'
import { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { FORM_INTENT } from './constants'
import { prisma } from '~/utils/db.server'
import { type Prisma, Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { uploadMembers } from '~/utils/member'
import { hash } from '@node-rs/argon2'
import { updateIntegrationDates } from '~/utils/integration.utils'
import { createMemberSchema } from '~/shared/schema'
import { saveMemberPicture } from '~/utils/member-picture.server'
import type { ExportMembersPayload } from './types'
import {
	createExportTribeMembersFile,
	getExportTribeMembers,
	getTribeName,
	getUrlParams,
} from './utils/utils.server'

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
	const { id: tribeId } = params
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(tribeId, 'tribeId is required')

	if (intent === FORM_INTENT.EXPORT) {
		return await exportMembers({
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

	return { success: true }
}

export type ActionType = typeof actionFn

async function handleCreateMemberAction(
	formData: FormData,
	churchId: string,
	tribeId: string,
) {
	const submission = await parseWithZod(formData, {
		schema: createMemberSchema.superRefine((fields, ctx) =>
			superRefineHandler(fields, ctx),
		),
		async: true,
	})

	if (submission.status !== 'success')
		return { lastResult: submission.reply(), success: false }

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

	return { success: true, lastResult: submission.reply() }
}

async function handleAddAssistantAction(formData: FormData, tribeId: string) {
	const submission = await parseWithZod(formData, {
		schema: addTribeAssistantSchema,
		async: true,
	})

	if (submission.status !== 'success')
		return { lastResult: submission.reply(), success: false }

	const { value } = submission

	await addTribeAssistant(value, tribeId)

	return { success: true, lastResult: submission.reply() }
}

async function addTribeAssistant(
	data: z.infer<typeof addTribeAssistantSchema>,
	tribeId: string,
) {
	const { memberId, password } = data

	const member = await prisma.user.findFirst({
		where: { tribeId },
	})

	if (!member) throw new Error('Ce fidèle n’appartient pas à cette tribu')

	const hashedPassword = await hashPassword(password)

	return prisma.user.update({
		where: { id: memberId },
		data: {
			isAdmin: true,
			roles: { push: Role.TRIBE_MANAGER },
			tribe: { connect: { id: tribeId } },
			password: {
				create: {
					hash: hashedPassword,
				},
			},
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

	if (submission.status !== 'success') {
		return { lastResult: submission.reply(), success: false }
	}

	const { file } = submission.value

	try {
		await uploadTribeMembers(file, churchId, tribeId)

		return {
			success: true,
			lastResult: null,
			message: 'Membres ajoutés avec succès.',
		}
	} catch (error: any) {
		return {
			lastResult: { error: error.message },
			success: false,
			message: null,
		}
	}
}

async function exportMembers({
	request,
	customerName,
	tribeId,
}: ExportMembersPayload) {
	const filterData = getUrlParams(request)
	const tribe = await getTribeName(tribeId)

	if (!tribe) {
		return data(
			{
				success: false,
				lastResult: null,
				message: "La tribu n'existe pas",
			},
			{ status: 404 },
		)
	}

	const members = await getExportTribeMembers({
		id: tribeId,
		filterData,
	})

	const fileName = `Membres de la tribu ${tribe.name}`

	const fileLink = await createExportTribeMembersFile({
		fileName,
		members,
		customerName,
	})

	return { success: true, message: null, lastResult: null, fileLink }
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
