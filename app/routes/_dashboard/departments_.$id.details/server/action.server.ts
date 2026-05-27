import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { addAssistantSchema } from '../schema'
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
import { saveMemberPicture } from '~/helpers/member-picture.server'
import { createEntityMemberSchema } from '~/shared/schema'
import {
	getDepartmentName,
	getExportDepartmentMembers,
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

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(departmentId, 'departmentId is required')

	if (intent === FORM_INTENT.EXPORT)
		return exportMembers(request, currentUser, departmentId)

	if (intent === FORM_INTENT.UPLOAD) {
		try {
			await uploadDepartmentMembers(
				formData.get('membersFile') as File,
				currentUser.churchId,
				departmentId,
			)
			return { status: 'success' }
		} catch (error: any) {
			return { status: 'error', message: error.message }
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
		await createMember(submission.value, currentUser.churchId, departmentId)
		return { status: 'success' }
	}

	if (intent === FORM_INTENT.ADD_ASSISTANT) {
		const submission = await parseWithZod(formData, {
			schema: addAssistantSchema,
			async: true,
		})
		if (submission.status !== 'success') return submission.reply()
		await addAssistant(submission.value, departmentId)
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

async function fetchMemberForAssistant(memberId: string) {
	const member = await prisma.user.findUnique({
		where: { id: memberId },
		select: { roles: true },
	})
	if (!member) throw new Error('Member not found')
	return member
}

function buildRolesWithDepartmentManager(currentRoles: Role[]): Role[] {
	return currentRoles.includes(Role.DEPARTMENT_MANAGER)
		? [...currentRoles]
		: [...currentRoles, Role.DEPARTMENT_MANAGER]
}

async function buildAssistantUpdatePayload(
	departmentId: string,
	updatedRoles: Role[],
	email?: string,
	password?: string,
) {
	return {
		isAdmin: true,
		roles: updatedRoles,
		department: { connect: { id: departmentId } },
		...(email && { email }),
		...(password && {
			password: { create: { hash: await hashPassword(password) } },
		}),
	}
}

async function addAssistant(
	data: z.infer<typeof addAssistantSchema>,
	departmentId: string,
) {
	const { memberId, email, password } = data
	const member = await fetchMemberForAssistant(memberId)
	const updatedRoles = buildRolesWithDepartmentManager(member.roles)
	const updateData = await buildAssistantUpdatePayload(
		departmentId,
		updatedRoles,
		email,
		password,
	)
	return prisma.user.update({ where: { id: memberId }, data: updateData })
}

async function uploadDepartmentMembers(
	file: File,
	churchId: string,
	departmentId: string,
) {
	const [uploadedMembers, currentMemberIds] = await Promise.all([
		uploadMembers(file, churchId),
		fetchEntityMemberIds('department', departmentId),
	])
	const newMemberIds = uploadedMembers.map(m => m.id)
	await prisma.$transaction(async tx => {
		await tx.department.update({
			where: { id: departmentId },
			data: { members: { connect: newMemberIds.map(id => ({ id })) } },
		})
		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'department',
			newMemberIds,
			currentMemberIds,
		})
	})
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
	const memberIds = members.map(m => m.id)
	const { allAttendances, previousAttendances } = await fetchAttendanceData(
		currentUser,
		memberIds,
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

async function exportMembers(
	request: Request,
	currentUser: Awaited<ReturnType<typeof requireUser>>,
	departmentId: string,
) {
	const { filterData, fromDate, toDate } = parseExportDates(request)
	const department = await getDepartmentName(departmentId)
	const dateRanges = prepareDateRanges(toDate)

	currentUser.departmentId = departmentId
	const members = await getExportDepartmentMembers({
		id: departmentId,
		filterData,
	})
	const membersWithAttendances = await buildMembersWithAttendances(
		currentUser,
		members,
		fromDate,
		dateRanges,
	)

	const fileName = `Membres du département ${department?.name ?? ''}`
	const fileLink = await createMembersExcelFile(
		membersWithAttendances,
		toDate,
		fileName,
	)
	return { status: 'success', fileLink: '/' + fileLink }
}
