import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { addAssistantSchema } from '../schema'
import { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { FORM_INTENT } from '../constants'
import { prisma } from '~/infrastructures/database/prisma.server'
import { type Prisma, Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { uploadMembers } from '~/utils/member'
import { hash } from '@node-rs/argon2'
import { fetchEntityMemberIds, updateIntegrationDates } from '~/helpers/integration.server'
import { saveMemberPicture } from '~/helpers/member-picture.server'
import { createEntityMemberSchema } from '~/shared/schema'
import {
	createExportDepartmentMembersFile,
	getDepartmentName,
	getExportDepartmentMembers,
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

	if (intent === FORM_INTENT.EXPORT) {
		return exportMembers(request, currentUser.name, departmentId)
	}

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
	const { memberId, email, password } = data

	const member = await prisma.user.findUnique({
		where: { id: memberId },
		select: { roles: true },
	})

	if (!member) throw new Error('Member not found')

	const updatedRoles = [...member.roles]
	if (!updatedRoles.includes(Role.DEPARTMENT_MANAGER)) {
		updatedRoles.push(Role.DEPARTMENT_MANAGER)
	}

	return prisma.user.update({
		where: { id: memberId },
		data: {
			isAdmin: true,
			roles: updatedRoles,
			department: { connect: { id: departmentId } },
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

async function exportMembers(
	request: Request,
	customerName: string,
	departmentId: string,
) {
	const filterData = getUrlParams(request)
	const department = await getDepartmentName(departmentId)

	const members = await getExportDepartmentMembers({
		id: departmentId,
		filterData,
	})

	const fileName = `Membres du département ${department?.name ?? ''}`

	const fileLink = await createExportDepartmentMembersFile({
		fileName,
		members,
		customerName,
	})

	return { status: 'success', fileLink }
}

export async function hashPassword(password: string) {
	const { ARGON_SECRET_KEY } = process.env
	invariant(ARGON_SECRET_KEY, 'ARGON_SECRET_KEY env var must be set')

	const hashedPassword = await hash(password, {
		secret: Buffer.from(ARGON_SECRET_KEY),
	})

	return hashedPassword
}
