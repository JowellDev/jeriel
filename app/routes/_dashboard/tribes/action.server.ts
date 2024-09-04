import { parseWithZod } from '@conform-to/zod'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import { createTribeSchema } from './schema'
import { z } from 'zod'
import { prisma } from '~/utils/db.server'
import { Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import type { Member } from './types'
import { hash } from '@node-rs/argon2'
import { uploadMembers } from '~/utils/member'

const argonSecretKey = process.env.ARGON_SECRET_KEY

const superRefineHandler = async (
	{ name, tribeManagerId }: { name: string; tribeManagerId: string },
	ctx: z.RefinementCtx,
	id?: string,
) => {
	const existingTribe = await prisma.tribe.findFirst({
		where: { id: { not: { equals: id ?? undefined } }, name },
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
}

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(argonSecretKey, 'ARGON_SECRET_KEY must be defined in .env file')

	const submission = await parseWithZod(formData, {
		schema: createTribeSchema.superRefine(
			async ({ name, tribeManagerId }, ctx) => {
				await superRefineHandler({ name, tribeManagerId }, ctx)
			},
		),
		async: true,
	})

	if (submission.status !== 'success') {
		return json({
			lastResult: submission.reply(),
			success: false,
			message: null,
		})
	}

	if (intent === 'create') {
		const { membersFile, memberIds, tribeManagerId, password, ...rest } =
			submission.value
		let members: Member[] = []

		const uploadedMembers = await uploadMembers(
			membersFile,
			currentUser.churchId,
		)

		const selectedMembers = await selectMembers(memberIds)

		members = [...uploadedMembers, ...selectedMembers] as Member[]

		const selectedManager = await prisma.user.findUnique({
			where: { id: tribeManagerId },
			include: { tribeManager: true, password: true },
		})

		if (!selectedManager) {
			return json({
				lastResult: submission.reply(),
				success: false,
				message: "Le responsable sélectionné n'existe pas.",
			})
		}

		let managerPassword = selectedManager.password
		let managerRoles = selectedManager.roles

		if (!managerPassword && password) {
			const hashedPassword = await hash(password, {
				secret: Buffer.from(argonSecretKey),
			})
			managerPassword = {
				hash: hashedPassword,
				userId: tribeManagerId,
			}
		}

		if (!managerRoles.includes(Role.TRIBE_MANAGER)) {
			managerRoles = [...managerRoles, Role.TRIBE_MANAGER]
		}

		await prisma.tribe.create({
			data: {
				...rest,
				managerId: tribeManagerId,
				members: {
					connect: members.map(member => ({ id: member.id })),
				},
				churchId: currentUser.churchId,
			},
		})

		return json({
			lastResult: submission.reply(),
			success: true,
			message: 'La tribu a été créee',
		})
	}

	return json({
		lastResult: submission.reply(),
		success: true,
		message: null,
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

export type ActionType = typeof actionFn
