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
import { PWD_REGEX } from '~/shared/constants'

const argonSecretKey = process.env.ARGON_SECRET_KEY

const superRefineHandler = async (
	data: z.infer<typeof createTribeSchema>,
	ctx: z.RefinementCtx,
	tribeId?: string,
) => {
	const existingTribe = await prisma.tribe.findFirst({
		where: { id: { not: { equals: tribeId ?? undefined } }, name: data.name },
	})

	const isAdmin = await prisma.user.findFirst({
		where: { id: data.tribeManagerId },
		select: { isAdmin: true },
	})

	const addCustomIssue = (path: (string | number)[], message: string) => {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path,
			message,
		})
	}

	if (existingTribe) {
		addCustomIssue(['name'], 'Cette tribu a déjà été créee')
	}

	if (!isAdmin) {
		if (!data.password) {
			addCustomIssue(['password'], 'Le mot de passe est requis')
		}

		if (data.password && data.password?.length < 8)
			addCustomIssue(
				['password'],
				'Le mot de passe doit contenir au moins 8 caractères',
			)

		if (!data.password?.match(PWD_REGEX)) {
			addCustomIssue(
				['password'],
				'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spéciaux',
			)
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

	if (intent === FORM_INTENT.CREATE_TRIBE) {
		await createTribe(payload, currentUser.churchId)

		return json({
			lastResult: submission.reply(),
			success: true,
			message: 'La tribu a été créee',
		})
	}

	if (intent === FORM_INTENT.UPDATE_TRIBE) {
		invariant(tribeId, 'Tribe id is required for update')

		await updateTribe(payload, tribeId, currentUser.churchId)

		return json({
			lastResult: submission.reply(),
			success: true,
			message: 'La tribu a été modifiée',
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
		if (password) {
			await updateManagerPassword(
				tribeManagerId,
				password,
				tx as unknown as Prisma.TransactionClient,
			)
		}

		const uploadedMembers = await uploadMembers(membersFile, churchId)

		const selectedMembers = await selectMembers(memberIds)

		const members = [...uploadedMembers, ...selectedMembers]

		await tx.tribe.create({
			data: {
				name,
				managerId: tribeManagerId,
				members: {
					connect: members.map(member => ({ id: member.id })),
				},
				churchId: churchId,
			},
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
		if (password) {
			await updateManagerPassword(
				tribeManagerId,
				password,
				tx as unknown as Prisma.TransactionClient,
			)

			const uploadedMembers = await uploadMembers(membersFile, churchId)

			const selectedMembers = await selectMembers(memberIds)

			const members = [...uploadedMembers, ...selectedMembers]

			await tx.user.updateMany({
				where: { tribeId },
				data: { tribeId: null },
			})

			await tx.tribe.update({
				where: { id: tribeId },
				data: {
					name,
					managerId: tribeManagerId,
					members: {
						connect: members.map(member => ({ id: member.id })),
					},
				},
			})
		}
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

export async function updateManagerPassword(
	managerId: string,
	password: string,
	tx: Prisma.TransactionClient,
) {
	const hashedPassword = await hashPassword(password)

	await tx.user.update({
		where: { id: managerId },
		data: {
			isAdmin: true,
			roles: [Role.TRIBE_MANAGER, Role.ADMIN],
			password: {
				create: {
					hash: hashedPassword,
				},
			},
		},
	})
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
