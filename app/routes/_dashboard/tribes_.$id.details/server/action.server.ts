import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { addTribeAssistantSchema, uploadMemberSchema } from '../schema'
import { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { FORM_INTENT } from '../constants'
import { prisma } from '~/infrastructures/database/prisma.server'
import { type Prisma, Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { uploadMembers } from '~/helpers/member-upload.server'
import {
	fetchEntityMemberIds,
	hashPassword,
	updateIntegrationDates,
} from '~/helpers/integration.server'
import { createEntityMemberSchema } from '~/shared/schema'
import { saveMemberPicture } from '~/helpers/member-picture.server'
import {
	getExportTribeMembers,
	getTribeName,
	getUrlParams,
} from '../utils/utils.server'
import {
	fetchAttendanceData,
	prepareDateRanges,
} from '~/helpers/attendance.server'
import { getMembersAttendances } from '~/shared/attendance'
import { createMembersExcelFile } from '~/utils/excel.server'
import { parseISO } from 'date-fns'

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

	if (intent === FORM_INTENT.EXPORT)
		return exportMembers({ request, currentUser, tribeId })
	if (intent === FORM_INTENT.UPLOAD)
		return handleUploadMembersAction(formData, currentUser.churchId, tribeId)
	if (intent === FORM_INTENT.CREATE)
		return handleCreateMemberAction(formData, currentUser.churchId, tribeId)
	if (intent === FORM_INTENT.ADD_ASSISTANT)
		return handleAddAssistantAction(formData, tribeId)

	return { status: 'success' }
}

export type ActionType = typeof actionFn

async function createTribeMember(
	data: z.infer<typeof createEntityMemberSchema>,
	churchId: string,
	tribeId: string,
) {
	const { picture, ...rest } = data
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
}

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
	await createTribeMember(submission.value, churchId, tribeId)
	return { status: 'success' }
}

async function handleAddAssistantAction(formData: FormData, tribeId: string) {
	const submission = await parseWithZod(formData, {
		schema: addTribeAssistantSchema,
		async: true,
	})
	if (submission.status !== 'success') return submission.reply()
	await addTribeAssistant(submission.value, tribeId)
	return { status: 'success' }
}

async function fetchMemberForAssistant(memberId: string) {
	const member = await prisma.user.findUnique({
		where: { id: memberId },
		select: { roles: true },
	})
	if (!member) throw new Error('Member not found')
	return member
}

function buildRolesWithTribeManager(currentRoles: Role[]): Role[] {
	return currentRoles.includes(Role.TRIBE_MANAGER)
		? [...currentRoles]
		: [...currentRoles, Role.TRIBE_MANAGER]
}

async function buildAssistantUpdatePayload(
	tribeId: string,
	updatedRoles: Role[],
	email?: string,
	password?: string,
) {
	return {
		isAdmin: true,
		roles: updatedRoles,
		tribe: { connect: { id: tribeId } },
		...(email && { email }),
		...(password && {
			password: { create: { hash: await hashPassword(password) } },
		}),
	}
}

async function addTribeAssistant(
	data: z.infer<typeof addTribeAssistantSchema>,
	tribeId: string,
) {
	const { memberId, email, password } = data
	const member = await fetchMemberForAssistant(memberId)
	const updatedRoles = buildRolesWithTribeManager(member.roles)
	const updateData = await buildAssistantUpdatePayload(
		tribeId,
		updatedRoles,
		email,
		password,
	)
	return prisma.user.update({ where: { id: memberId }, data: updateData })
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
	try {
		await uploadTribeMembers(submission.value.file, churchId, tribeId)
		return { status: 'success' }
	} catch (error: any) {
		return { ...submission.reply(), status: 'error', error: error.cause }
	}
}

function parseExportDates(request: Request) {
	const filterData = getUrlParams(request)
	const fromDate = parseISO(filterData.from)
	const toDate = parseISO(filterData.to)
	return { filterData, fromDate, toDate }
}

async function buildMembersWithAttendances(
	currentUser: Awaited<ReturnType<typeof requireUser>>,
	members: any[],
	fromDate: Date,
	dateRanges: ReturnType<typeof prepareDateRanges>,
) {
	const {
		toDate: processedToDate,
		currentMonthSundays,
		previousMonthSundays,
		previousFrom,
		previousTo,
	} = dateRanges
	const { allAttendances, previousAttendances } = await fetchAttendanceData(
		currentUser,
		members.map(m => m.id),
		fromDate,
		processedToDate,
		previousFrom,
		previousTo,
	)
	return getMembersAttendances(
		members,
		currentMonthSundays,
		previousMonthSundays,
		allAttendances,
		previousAttendances,
	)
}

async function exportMembers({
	request,
	currentUser,
	tribeId,
}: {
	request: Request
	currentUser: Awaited<ReturnType<typeof requireUser>>
	tribeId: string
}) {
	const { filterData, fromDate, toDate } = parseExportDates(request)
	const tribe = await getTribeName(tribeId)
	const dateRanges = prepareDateRanges(toDate)

	currentUser.tribeId = tribeId
	const members = await getExportTribeMembers({ id: tribeId, filterData })
	const membersWithAttendances = await buildMembersWithAttendances(
		currentUser,
		members,
		fromDate,
		dateRanges,
	)

	const fileName = `Membres de la tribu ${tribe?.name}`
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
