import { z, type RefinementCtx } from 'zod'
import { prisma } from '~/infrastructures/database/prisma.server'
import { createDepartmentSchema, updateDepartmentSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'

interface UniqueFieldsCheck {
	id?: string
	addedManagerEmail?: string
	name: string
}

async function verifyUniqueFields({ id, name }: UniqueFieldsCheck) {
	return {
		departmentExists: !!(await prisma.department.findFirst({
			where: { id: { not: { equals: id ?? undefined } }, name },
		})),
	}
}

async function superRefineHandler(
	{ name, id, addedManagerEmail }: UniqueFieldsCheck,
	ctx: RefinementCtx,
) {
	const { departmentExists } = await verifyUniqueFields({ id, name })

	if (departmentExists) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['name'],
			message: 'Ce département existe déjà.',
		})

		return
	}

	const user = await prisma.user.findFirst({
		where: { email: addedManagerEmail },
	})

	if (addedManagerEmail && user) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['managerEmail'],
			message: 'Adresse email déjà utilisée.',
		})
	}
}

export function getSubmissionData(formData: FormData, id?: string) {
	const schema = id ? updateDepartmentSchema : createDepartmentSchema
	return parseWithZod(formData, {
		schema: schema.superRefine((data, ctx) =>
			superRefineHandler({ ...data, id }, ctx),
		),
		async: true,
	})
}
