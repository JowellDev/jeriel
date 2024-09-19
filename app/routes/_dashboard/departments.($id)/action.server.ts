import { parseWithZod } from '@conform-to/zod'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import {
	createDepartmentSchema,
	updateDepartmentSchema,
	type CreateDepartmentFormData,
	type UpdateDepartmentFormData,
} from './schema'
import invariant from 'tiny-invariant'
import { hash } from '@node-rs/argon2'
import { prisma } from '~/utils/db.server'
import { type RefinementCtx, z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import {
	type MemberData,
	processExcelFile,
} from '../../../utils/process-member-model'

const argonSecretKey = process.env.ARGON_SECRET_KEY

type UniqueFieldsCheck = { name: string; id?: string }

const verifyUniqueFields = async ({ id, name }: UniqueFieldsCheck) => {
	const departmentExists = !!(await prisma.department.findFirst({
		where: { id: { not: { equals: id ?? undefined } }, name },
	}))

	return { departmentExists }
}

const superRefineHandler = async (
	fields: UniqueFieldsCheck,
	ctx: RefinementCtx,
) => {
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
			data as CreateDepartmentFormData,
			argonSecretKey,
			currentUser.churchId,
		)
	}

	if (intent === 'update' && id) {
		await updateDepartment(id, data, argonSecretKey)
	}

	return json(submission.reply(), { status: 200 })
}

export type ActionType = typeof actionFn

async function createDepartment(
	data: CreateDepartmentFormData,
	secret: string,
	churchId: string,
) {
	// const hashedPassword = await hash(data.password, {
	// 	secret: Buffer.from(secret),
	// })

	const memberData = await getMemberData(data)

	console.log(memberData, ' member data')

	// await prisma.$transaction(async tx => {
	// 	const department = await tx.department.create({
	// 		data: {
	// 			name: data.name,
	// 			church: { connect: { id: churchId } },
	// 			manager: { connect: { id: data.managerId } },
	// 		},
	// 	})

	// 	// Create or update members and connect them to the department
	// 	for (const member of memberData) {
	// 		await tx.user.upsert({
	// 			where: { phone: member.phone },
	// 			create: {
	// 				name: member.name,
	// 				phone: member.phone,
	// 				location: member.location,
	// 				church: { connect: { id: churchId } },
	// 				department: { connect: { id: department.id } },
	// 				roles: { set: ['MEMBER'] },
	// 			},
	// 			update: {
	// 				name: member.name,
	// 				location: member.location,
	// 				department: { connect: { id: department.id } },
	// 			},
	// 		})
	// 	}

	// 	await tx.user.update({
	// 		where: { id: data.managerId },
	// 		data: {
	// 			password: {
	// 				upsert: {
	// 					create: { hash: hashedPassword },
	// 					update: { hash: hashedPassword },
	// 				},
	// 			},
	// 			roles: { push: 'DEPARTMENT_MANAGER' },
	// 			managedDepartment: { connect: { id: department.id } },
	// 		},
	// 	})
	// })
}

async function updateDepartment(
	id: string,
	data: UpdateDepartmentFormData,
	secret: string,
) {
	const memberData = await getMemberData(data)

	await prisma.$transaction(async tx => {
		const department = await tx.department.update({
			where: { id },
			data: {
				name: data.name,
				manager: { connect: { id: data.managerId } },
			},
		})

		for (const member of memberData) {
			await tx.user.upsert({
				where: { phone: member.phone },
				create: {
					name: member.name,
					phone: member.phone,
					location: member.location,
					department: { connect: { id } },
					roles: { set: ['MEMBER'] },
				},
				update: {
					name: member.name,
					location: member.location,
					department: { connect: { id } },
				},
			})
		}

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
					roles: { push: 'DEPARTMENT_MANAGER' },
					managedDepartment: { connect: { id: department.id } },
				},
			})
		}
	})
}

async function getMemberData(
	data: CreateDepartmentFormData | UpdateDepartmentFormData,
): Promise<MemberData[]> {
	if (data.selectionMode === 'manual' && data.members) {
		return JSON.parse(data.members) as MemberData[]
	} else if (data.selectionMode === 'file' && data.membersFile) {
		return processExcelFile(data.membersFile)
	}
	return []
}
