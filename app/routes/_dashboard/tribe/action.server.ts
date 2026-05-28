import { parseWithZod } from '@conform-to/zod'
import { type Prisma, Role } from '@prisma/client'
import { type ActionFunctionArgs, data } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { FORM_INTENT } from '~/shared/constants'
import { createEntityMemberSchema, uploadMemberSchema } from '~/shared/schema'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import {
	fetchEntityMemberIds,
	updateIntegrationDates,
} from '~/helpers/integration.server'
import { uploadMembers } from '~/helpers/member-upload.server'
import { saveMemberPicture } from '~/helpers/member-picture.server'
import { notifyAdminForAddedMemberInEntity } from '~/helpers/notification.server'
import {
	buildMembersWithAttendances,
	parseExportDateRanges,
} from '~/helpers/attendance.server'
import { createMembersExcelFile } from '~/utils/excel.server'
import { TRIBE_FORM_INTENT } from './constants'
import { getTribeName, getExportTribeMembers } from './utils.server'
import { filterSchema } from './schema'

const isPhoneExists = async ({
	phone,
}: Partial<z.infer<typeof createEntityMemberSchema>>) => {
	const field = await prisma.user.findFirst({
		where: { phone },
	})

	return !!field
}

const superRefineHandler = async (
	data: Partial<z.infer<typeof createEntityMemberSchema>>,
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

async function handleUploadIntent(
	formData: FormData,
	churchId: string,
	tribeId: string,
) {
	const submission = await parseWithZod(formData, {
		schema: uploadMemberSchema,
		async: true,
	})
	if (submission.status !== 'success')
		return data(
			{ lastResult: submission.reply(), success: false },
			{ status: 400 },
		)
	const { file } = submission.value
	if (!file)
		return data(
			{
				lastResult: { error: 'Veuillez sélectionner un fichier à importer.' },
				success: false,
				message: null,
			},
			{ status: 400 },
		)
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

async function handleCreateMemberIntent(
	formData: FormData,
	churchId: string,
	tribeId: string,
	managerId: string,
) {
	const submission = await parseWithZod(formData, {
		schema: createEntityMemberSchema.superRefine((fields, ctx) =>
			superRefineHandler(fields, ctx),
		),
		async: true,
	})
	if (submission.status !== 'success')
		return data(
			{ lastResult: submission.reply(), success: false },
			{ status: 400 },
		)
	const member = await createMember(submission.value, churchId, tribeId)
	await notifyAdminForAddedMemberInEntity({
		memberName: member.name,
		entity: 'TRIBE',
		entityId: tribeId,
		churchId,
		managerId,
	})
	return data(
		{ success: true, lastResult: submission.reply() },
		{ status: 200 },
	)
}

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')
	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(currentUser.tribeId, 'tribeId is required')
	const { churchId, tribeId, id: managerId } = currentUser
	if (intent === TRIBE_FORM_INTENT.EXPORT)
		return exportMembers(request, currentUser, tribeId)
	if (intent === FORM_INTENT.UPLOAD)
		return handleUploadIntent(formData, churchId, tribeId)
	if (intent === FORM_INTENT.CREATE)
		return handleCreateMemberIntent(formData, churchId, tribeId, managerId)
}

async function createMember(
	data: z.infer<typeof createEntityMemberSchema>,
	churchId: string,
	tribeId: string,
) {
	const { picture, ...rest } = data
	const pictureUrl = picture ? await saveMemberPicture(picture) : null
	return prisma.user.create({
		data: {
			...rest,
			...(pictureUrl && { pictureUrl }),
			roles: [Role.MEMBER],
			church: { connect: { id: churchId } },
			tribe: { connect: { id: tribeId } },
			integrationDate: { create: { tribeDate: new Date() } },
		},
	})
}

function getUrlParams(request: Request) {
	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: filterSchema })
	invariant(submission.status === 'success', 'invalid criteria')
	return submission.value
}

async function exportMembers(
	request: Request,
	currentUser: Awaited<ReturnType<typeof requireUser>>,
	tribeId: string,
) {
	const filterData = getUrlParams(request)
	const { fromDate, toDate, dateRanges } = parseExportDateRanges(filterData)
	const tribe = await getTribeName(tribeId)

	currentUser.departmentId = null
	currentUser.honorFamilyId = null
	currentUser.tribeId = tribeId

	const members = await getExportTribeMembers(
		tribeId,
		currentUser.churchId!,
		filterData,
	)
	const membersWithAttendances = await buildMembersWithAttendances(
		currentUser,
		members,
		fromDate,
		dateRanges,
	)

	const fileName = `Membres de la tribu ${tribe?.name ?? ''}`
	const fileLink = await createMembersExcelFile(
		membersWithAttendances,
		toDate,
		fileName,
	)

	return { status: 'success', fileLink: '/' + fileLink }
}

async function uploadTribeMembers(
	file: File,
	churchId: string,
	tribeId: string,
) {
	const [uploadedMembers, currentMemberIds] = await Promise.all([
		uploadMembers(file, churchId),
		fetchEntityMemberIds('tribe', tribeId),
	])

	const newMemberIds = uploadedMembers.map(m => m.id)

	await prisma.$transaction(async tx => {
		await tx.tribe.update({
			where: { id: tribeId },
			data: { members: { connect: newMemberIds.map(id => ({ id })) } },
		})

		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'tribe',
			newMemberIds,
			currentMemberIds,
		})
	})
}

export type ActionType = typeof actionFn
