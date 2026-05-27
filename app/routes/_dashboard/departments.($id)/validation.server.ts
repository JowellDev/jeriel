import { z, type RefinementCtx } from 'zod'
import { prisma } from '~/infrastructures/database/prisma.server'
import { createDepartmentSchema, updateDepartmentSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'

interface UniqueFieldsCheck {
	id?: string
	managerId: string
	managerEmail?: string
	name: string
}

async function verifyUniqueFields({ id, name }: UniqueFieldsCheck) {
	return {
		departmentExists: !!(await prisma.department.findFirst({
			where: { id: { not: { equals: id ?? undefined } }, name },
		})),
	}
}

async function validateManagerEmail(
	managerEmail: string | undefined,
	managerId: string,
	ctx: RefinementCtx,
) {
	if (!managerEmail) return
	const existingUser = await prisma.user.findFirst({
		where: { email: managerEmail, id: { not: managerId } },
	})
	if (existingUser) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['managerEmail'],
			message: 'Cette adresse email est déjà utilisée.',
		})
	}
}

async function superRefineHandler(
	{ name, id, managerId, managerEmail }: UniqueFieldsCheck,
	ctx: RefinementCtx,
) {
	const { departmentExists } = await verifyUniqueFields({ id, name, managerId })
	if (departmentExists) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['name'],
			message: 'Ce département existe déjà.',
		})
		return
	}
	await validateManagerEmail(managerEmail, managerId, ctx)
}

export function getSubmissionData(formData: FormData, id?: string) {
	const schema = id ? updateDepartmentSchema : createDepartmentSchema
	return parseWithZod(formData, {
		schema: schema.superRefine((data, ctx) =>
			superRefineHandler(
				{
					id,
					name: data.name,
					managerId: data.managerId,
					managerEmail: data.managerEmail,
				},
				ctx,
			),
		),
		async: true,
	})
}
