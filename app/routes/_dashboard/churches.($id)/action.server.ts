import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { createChurchSchema, updateChurchSchema } from './schema'
import invariant from 'tiny-invariant'
import { hash } from '@node-rs/argon2'
import { prisma } from '~/utils/db.server'
import { type RefinementCtx, z } from 'zod'
import { Role } from '@prisma/client'

const argonSecretKey = process.env.ARGON_SECRET_KEY

type Fields = { churchName: string; adminEmail: string; id?: string }
type CreateChurchData = z.infer<typeof createChurchSchema>
type UpdateChurchData = z.infer<typeof updateChurchSchema>

const verifyUniqueFields = async ({ id, churchName, adminEmail }: Fields) => {
	const churchExists = !!(await prisma.church.findFirst({
		where: { id: { not: { equals: id ?? undefined } }, name: churchName },
	}))

	const emailExists = !!(await prisma.user.findFirst({
		where: {
			email: adminEmail,
			...(id ? { church: { id: { not: { equals: id } } } } : {}),
		},
	}))

	return { churchExists, emailExists }
}

const superRefineHandler = async (fields: Fields, ctx: RefinementCtx) => {
	const { churchExists, emailExists } = await verifyUniqueFields(fields)

	if (churchExists) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['churchName'],
			message: 'Cette église existe déjà',
		})
	}

	if (emailExists) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['admin.email'],
			message: 'Cette adresse email est déjà utilisée',
		})
	}
}

async function getSubmissionData(formData: FormData, id?: string) {
	const schema = id ? updateChurchSchema : createChurchSchema

	return parseWithZod(formData, {
		schema: schema.superRefine(({ admin, churchName }, ctx) =>
			superRefineHandler({ adminEmail: admin.email, churchName, id }, ctx),
		),
		async: true,
	})
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	invariant(argonSecretKey, 'ARGON_SECRET_KEY must be defined in .env file')
	const { id } = params

	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'activate' && id) {
		const church = await prisma.church.findFirst({
			where: { id },
			select: { isActive: true },
		})

		if (!church) return { status: 'error', error: 'Eglise introuvable' }

		await prisma.church.update({
			where: { id },
			data: { isActive: !church.isActive },
		})

		return { status: 'success' }
	}

	const submission = await getSubmissionData(formData, id)

	if (submission.status !== 'success') return submission.reply()

	const { value } = submission

	if (intent === 'create')
		await createChurch(value as CreateChurchData, argonSecretKey)

	if (intent === 'update' && id) await updateChurch(id, value, argonSecretKey)

	return { status: 'success' }
}

export type ActionType = typeof actionFn

async function createChurch(data: CreateChurchData, secret: string) {
	const hashedPassword = await hash(data.passwordConfirm, {
		secret: Buffer.from(secret),
	})

	const church = await prisma.church.create({
		data: {
			name: data.churchName,
			smsEnabled: data.smsEnabled,
			admin: {
				create: {
					email: data.admin.email,
					phone: data.admin.phone,
					name: data.admin.name,
					isAdmin: true,
					roles: [Role.ADMIN],
					password: { create: { hash: hashedPassword } },
				},
			},
		},
		select: {
			id: true,
			admin: { select: { id: true } },
		},
	})

	await prisma.user.update({
		where: { id: church.admin.id },
		data: { churchId: church.id },
	})
}

async function updateChurch(
	id: string,
	data: Partial<UpdateChurchData>,
	secret: string,
) {
	const updateData: any = {
		name: data.churchName,
		smsEnabled: data.smsEnabled,
		admin: {
			update: {
				name: data.admin?.name,
				email: data.admin?.email,
				phone: data.admin?.phone,
			},
		},
	}

	if (data.passwordConfirm) {
		const hashedPassword = await hash(data.passwordConfirm, {
			secret: Buffer.from(secret),
		})
		updateData.admin.update.password = {
			upsert: {
				update: {
					hash: hashedPassword,
				},
				create: {
					hash: hashedPassword,
				},
			},
		}
	}

	await prisma.church.update({ where: { id }, data: updateData })
}
