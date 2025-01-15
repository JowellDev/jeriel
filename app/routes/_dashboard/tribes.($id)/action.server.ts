import { parseWithZod } from '@conform-to/zod'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import { createTribeSchema } from './schema'
import { z } from 'zod'
import { prisma } from '~/utils/db.server'
import { type Prisma, Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { hash } from '@node-rs/argon2'
import { uploadMembers } from '~/utils/member'
import { FORM_INTENT } from './constants'
import { PWD_ERROR_MESSAGE, PWD_REGEX } from '~/shared/constants'
import { updateIntegrationDates } from '~/utils/integration.utils'

const argonSecretKey = process.env.ARGON_SECRET_KEY

const superRefineHandler = async (
	data: z.infer<typeof createTribeSchema>,
	ctx: z.RefinementCtx,
	tribeId?: string,
) => {
	const existingTribe = await prisma.tribe.findFirst({
		where: { id: { not: { equals: tribeId ?? undefined } }, name: data.name },
	})

	const user = await prisma.user.findFirst({
		where: { id: data.tribeManagerId },
		select: { isAdmin: true },
	})

	const isAdmin = user?.isAdmin

	const addCustomIssue = (path: (string | number)[], message: string) => {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path,
			message,
		})
	}

	if (existingTribe) {
		addCustomIssue(['name'], 'Cette tribu a déjà été créée')
	}

	if (!isAdmin) {
		if (!data.password) {
			addCustomIssue(['password'], 'Le mot de passe est requis')
		}

		if (data.password && data.password?.length < 8)
			addCustomIssue(['password'], PWD_ERROR_MESSAGE.min)

		if (!data.password?.match(PWD_REGEX)) {
			addCustomIssue(['password'], PWD_ERROR_MESSAGE.invalid)
		}
	}
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(argonSecretKey, 'ARGON_SECRET_KEY must be defined in .env file')

	const { id: tribeId } = params

	const submission = await parseWithZod(formData, {
		schema: createTribeSchema.superRefine(async (fields, ctx) => {
			await superRefineHandler(fields, ctx, tribeId)
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return json({
			lastResult: submission.reply(),
			success: false,
			message: null,
		})
	}

	const payload = submission.value

	if (intent === FORM_INTENT.UPDATE_TRIBE) {
		invariant(tribeId, 'Tribe id is required for update')

		await updateTribe(payload, tribeId, currentUser.churchId)

		return json({
			lastResult: submission.reply(),
			success: true,
			message: 'La tribu a été modifiée',
		})
	}

	if (intent === FORM_INTENT.CREATE_TRIBE) {
		await createTribe(payload, currentUser.churchId)

		return json({
			lastResult: submission.reply(),
			success: true,
			message: 'La tribu a été créée',
		})
	}

	return json({
		lastResult: submission.reply(),
		success: true,
		message: null,
	})
}

async function createTribe(
	data: z.infer<typeof createTribeSchema>,
	churchId: string,
) {
	const { name, tribeManagerId, password, memberIds, membersFile } = data

	await prisma.$transaction(async tx => {
		const uploadedMembers = await uploadMembers(membersFile, churchId)
		const selectedMembers = await selectMembers(memberIds)
		const members = [...uploadedMembers, ...selectedMembers]

		const tribe = await tx.tribe.create({
			data: {
				name,
				managerId: tribeManagerId,
				members: {
					connect: members.map(member => ({ id: member.id })),
				},
				churchId: churchId,
			},
		})

		await updateManagerData({
			tribeId: tribe.id,
			tx: tx as unknown as Prisma.TransactionClient,
			isCreating: true,
			password,
			managerId: tribeManagerId,
		})

		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'tribe',
			newManagerId: tribeManagerId,
			newMemberIds: members.map(m => m.id),
			currentMemberIds: [],
		})
	})
}

async function updateTribe(
	data: z.infer<typeof createTribeSchema>,
	tribeId: string,
	churchId: string,
) {
	const { name, tribeManagerId, password, memberIds, membersFile } = data

	await prisma.$transaction(async tx => {
		const currentTribe = await tx.tribe.findUnique({
			where: { id: tribeId },
			select: {
				managerId: true,
				members: {
					select: { id: true },
				},
			},
		})

		invariant(currentTribe, 'Tribe not found')

		if (currentTribe.managerId !== tribeManagerId) {
			await updateManagerData({
				tribeId,
				tx: tx as unknown as Prisma.TransactionClient,
				managerId: tribeManagerId,
				isCreating: false,
				password,
			})

			const oldManager = await tx.user.findUnique({
				where: { id: currentTribe.managerId },
				select: { roles: true },
			})

			invariant(oldManager, 'Old manager not found')

			const hasOtherManagerialRoles = oldManager.roles.some(role =>
				[Role.DEPARTMENT_MANAGER, Role.HONOR_FAMILY_MANAGER].includes(role),
			)

			const updatedRoles = oldManager.roles.filter(
				role => role !== Role.TRIBE_MANAGER,
			)

			await tx.user.update({
				where: { id: currentTribe.managerId },
				data: {
					roles: updatedRoles,
					...(!hasOtherManagerialRoles && { password: { delete: true } }),
					...(!hasOtherManagerialRoles && { isAdmin: false }),
				},
			})
		}

		const uploadedMembers = await uploadMembers(membersFile, churchId)
		const selectedMembers = await selectMembers(memberIds)
		const members = [...uploadedMembers, ...selectedMembers]

		await tx.tribe.update({
			where: { id: tribeId },
			data: {
				name: name,
				managerId: tribeManagerId,
				members: {
					set: members.map(member => ({ id: member.id })),
				},
			},
		})

		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'tribe',
			newManagerId: tribeManagerId,
			oldManagerId: currentTribe.managerId,
			newMemberIds: members.map(m => m.id),
			currentMemberIds: currentTribe.members.map(m => m.id),
		})
	})
}

async function selectMembers(memberIds: string[] | undefined) {
	if (memberIds && memberIds.length > 0) {
		return await prisma.user.findMany({
			where: { id: { in: memberIds } },
		})
	}
	return []
}

async function hashPassword(password: string) {
	const { ARGON_SECRET_KEY } = process.env
	invariant(ARGON_SECRET_KEY, 'ARGON_SECRET_KEY env var must be set')

	const hashedPassword = await hash(password, {
		secret: Buffer.from(ARGON_SECRET_KEY),
	})

	return hashedPassword
}

export type ActionType = typeof actionFn

function checkOtherManagerialRoles(roles: Role[]) {
	return !!roles.some(role =>
		[Role.DEPARTMENT_MANAGER, Role.HONOR_FAMILY_MANAGER].includes(role),
	)
}

async function updateManagerData({
	tx,
	tribeId,
	managerId,
	password,
	isCreating,
}: {
	tx: Prisma.TransactionClient
	tribeId: string
	managerId: string
	password: string | undefined
	isCreating: boolean
}) {
	const { ARGON_SECRET_KEY } = process.env
	invariant(ARGON_SECRET_KEY, 'ARGON_SECRET_KEY env var must be set')

	const currentManager = await tx.user.findUnique({
		where: { id: managerId },
		select: { roles: true, isAdmin: true, password: true },
	})

	invariant(currentManager, 'Manager not found')

	const hasOtherManagerialRoles = checkOtherManagerialRoles(
		currentManager.roles,
	)

	const updatedRoles = [...currentManager.roles]
	if (!updatedRoles.includes(Role.TRIBE_MANAGER)) {
		updatedRoles.push(Role.TRIBE_MANAGER)
	}

	const updateData: Prisma.UserUpdateInput = {
		isAdmin: true,
		roles: updatedRoles,
		tribe: {
			connect: { id: tribeId },
		},
	}

	if (!currentManager.isAdmin && password) {
		const hashedPassword = await hashPassword(password)
		updateData.password = { create: { hash: hashedPassword } }
	}

	if (isCreating && !hasOtherManagerialRoles && !password) {
		throw new Error(
			'Password is required for new tribe managers without other managerial roles',
		)
	}

	await tx.user.update({
		where: { id: managerId },
		data: updateData,
	})
}
