import { parseWithZod } from '@conform-to/zod'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import { createDepartmentSchema, updateDepartmentSchema } from './schema'
import invariant from 'tiny-invariant'
import { hash } from '@node-rs/argon2'
import { prisma } from '~/utils/db.server'
import { type RefinementCtx, z } from 'zod'
import { requireUser } from '~/utils/auth.server'

const argonSecretKey = process.env.ARGON_SECRET_KEY

type Fields = { name: string; id?: string }
type CreateData = z.infer<typeof createDepartmentSchema>
type UpdateData = z.infer<typeof updateDepartmentSchema>

const verifyUniqueFields = async ({ id, name }: Fields) => {
	const departmentExists = !!(await prisma.department.findFirst({
		where: { id: { not: { equals: id ?? undefined } }, name },
	}))

	return { departmentExists }
}

const superRefineHandler = async (fields: Fields, ctx: RefinementCtx) => {
	const { departmentExists } = await verifyUniqueFields(fields)

	if (departmentExists) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['name'],
			message: 'Ce département existe déjà',
		})
	}
}

async function getSubmissionData(formData: FormData, id?: string) {
	const schema = id ? updateDepartmentSchema : createDepartmentSchema

	return parseWithZod(formData, {
		schema: schema.superRefine(({ name }, ctx) =>
			superRefineHandler({ name, id }, ctx),
		),
		async: true,
	})
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)

	const { id } = params

	const formData = await request.formData()
	const intent = formData.get('intent')

	const submission = await getSubmissionData(formData, id)

	if (submission.status !== 'success') {
		return json(submission.reply(), { status: 400 })
	}

	invariant(currentUser.churchId, 'User must have a church')
	invariant(argonSecretKey, 'ARGON_SECRET_KEY must be defined in .env file')

	const data = submission.value

	if (intent === 'create') {
		await createDepartment(
			data as CreateData,
			argonSecretKey,
			currentUser.churchId,
		)
	} else if (intent === 'update' && id) {
		await updateDepartment(id, data as UpdateData, argonSecretKey)
	} else {
		throw new Error('Invalid intent')
	}

	return json(submission.reply(), { status: 200 })
}

export type ActionType = typeof actionFn

async function createDepartment(
	data: CreateData,
	secret: string,
	churchId: string,
) {
	const hashedPassword = await hash(data.password, {
		secret: Buffer.from(secret),
	})

	await prisma.$transaction(async tx => {
		const department = await tx.department.create({
			data: {
				name: data.name,
				manager: {
					connect: { id: data.managerId },
				},
				church: {
					connect: { id: churchId },
				},
				members: { connect: data.members.map(id => ({ id })) },
			},
		})

		await tx.user.update({
			where: { id: data.managerId },
			data: {
				password: {
					upsert: {
						create: { hash: hashedPassword },
						update: { hash: hashedPassword },
					},
				},
				roles: {
					push: 'DEPARTMENT_MANAGER',
				},
				managedDepartment: {
					connect: { id: department.id },
				},
			},
		})
	})
}

async function updateDepartment(id: string, data: UpdateData, secret: string) {
	await prisma.$transaction(async tx => {
		await tx.department.update({
			where: { id },
			data: {
				name: data.name,
				manager: { connect: { id: data.managerId } },
				members: { set: data.members.map(id => ({ id })) },
			},
		})

		if (data.password) {
			const hashedPassword = await hash(data.password, {
				secret: Buffer.from(secret),
			})
			await tx.user.update({
				where: { id: data.managerId },
				data: {
					password: {
						upsert: {
							create: { hash: hashedPassword },
							update: { hash: hashedPassword },
						},
					},
					roles: {
						push: 'DEPARTMENT_MANAGER',
					},
				},
			})
		}
	})
}
