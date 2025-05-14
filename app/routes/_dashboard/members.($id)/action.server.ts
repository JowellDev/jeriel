import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { editMemberSchema, filterSchema, uploadMembersSchema } from './schema'
import { z } from 'zod'
import { type AuthenticatedUser, requireUser } from '~/utils/auth.server'
import { FORM_INTENT } from './constants'
import { prisma } from '~/utils/db.server'
import { Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { type MemberData, processExcelFile } from '~/utils/process-member-model'
import {
	createMemberFile,
	getExportMembers,
	getFilterOptions,
} from './utils/server'
import { uploadFile } from '~/utils/upload.server'
import { getFileBufferAndPath } from '~/utils/file'

interface EditMemberPayload {
	id?: string
	churchId: string
	data: z.infer<typeof editMemberSchema>
	intent: string
}

const isPhoneExists = async (
	{ phone }: Partial<z.infer<typeof editMemberSchema>>,
	userId?: string,
) => {
	const field = await prisma.user.findFirst({
		where: { phone, id: { not: userId } },
	})

	return !!field
}

const superRefineHandler = async (
	data: Partial<z.infer<typeof editMemberSchema>>,
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
	const intent = formData.get('intent') as string

	invariant(currentUser.churchId, 'Invalid churchId')

	if (intent === FORM_INTENT.EXPORT) return exportMembers(request, currentUser)

	if (intent === FORM_INTENT.UPLOAD)
		return uploadMembers(formData, currentUser.churchId)

	const submission = await parseWithZod(formData, {
		schema: editMemberSchema.superRefine((fields, ctx) =>
			superRefineHandler(fields, ctx, memberId),
		),
		async: true,
	})

	if (submission.status !== 'success')
		return { lastResult: submission.reply(), success: false }

	const { value } = submission

	if (intent && [FORM_INTENT.EDIT, FORM_INTENT.CREATE].includes(intent)) {
		await editMember({
			intent,
			id: memberId,
			churchId: currentUser.churchId,
			data: value,
		})
	}

	return { success: true, lastResult: submission.reply() }
}

export type ActionType = Awaited<ReturnType<typeof actionFn>>

async function editMember({ id, churchId, intent, data }: EditMemberPayload) {
	const { tribeId, departmentId, honorFamilyId, picture, ...rest } = data
	const pictureUrl = picture ? await saveMemberPicture(picture) : null
	const isUpdate = intent === FORM_INTENT.EDIT

	const payload = {
		...rest,
		pictureUrl,
		...(!isUpdate && {
			roles: [Role.MEMBER],
			church: { connect: { id: churchId } },
		}),
		...(tribeId && { tribe: { connect: { id: tribeId } } }),
		...(departmentId && { department: { connect: { id: departmentId } } }),
		...(honorFamilyId && { honorFamily: { connect: { id: honorFamilyId } } }),
	}

	return isUpdate && id
		? prisma.user.update({ where: { id }, data: payload })
		: prisma.user.create({ data: payload })
}

async function uploadMembers(formData: FormData, churchId: string) {
	const submission = parseWithZod(formData, { schema: uploadMembersSchema })

	if (submission.status !== 'success')
		return { lastResult: submission.reply(), success: false }

	try {
		const { data: members, errors } = await processExcelFile(
			submission.value.file as File,
		)

		if (errors.length) throw new Error('Données invalides', { cause: errors })

		await upsertMembers(members, churchId)

		return { success: true, lastResult: submission.reply() }
	} catch (error: any) {
		return {
			success: false,
			lastResult: submission.reply(),
			error: 'Fichier invalide ! Veuillez télécharger le modèle.',
		}
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

async function exportMembers(request: Request, currentUser: AuthenticatedUser) {
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const where = getFilterOptions(submission.value, currentUser, true)

	const members = await getExportMembers(where)

	const fileLink = await createMemberFile({
		members,
		feature: 'Membres',
		customerName: currentUser.name,
	})

	return { success: true, message: null, lastResult: null, fileLink }
}

export async function saveMemberPicture(image: File) {
	const folder = '/members/pictures'
	const data = await getFileBufferAndPath(image, folder)
	const { fileBuffer, filePath } = data

	return uploadFile(filePath, Buffer.from(fileBuffer), image.size, {
		'content-type': image.type,
	})
}
