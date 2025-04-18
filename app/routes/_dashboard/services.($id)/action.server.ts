import { type ActionFunctionArgs, data, json } from '@remix-run/node'
import { schema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import { requireUser } from '~/utils/auth.server'
import { z, type RefinementCtx } from 'zod'
import { FORM_INTENT } from './constants'
import { prisma } from '~/utils/db.server'
import { notifyManagerForServiceAction } from '~/utils/notification.util'

const superRefineHandler = async (
	fields: z.infer<typeof schema>,
	ctx: RefinementCtx,
	id?: string,
) => {
	const { departmentId, tribeId, from, to } = fields

	const service = await prisma.service.findFirst({
		where: {
			id: { not: { equals: id } },
			from: new Date(from),
			to: new Date(to),
			OR: [{ departmentId }, { tribeId }],
		},
	})

	if (service) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'Période de service déja existante',
			path: ['from'],
		})
	}
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	await requireUser(request)

	const { id } = params
	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === FORM_INTENT.DELETE && id) {
		const serviceToDelete = await prisma.service.findUnique({
			where: { id },
			select: {
				from: true,
				to: true,
				departmentId: true,
				tribeId: true,
			},
		})

		if (serviceToDelete) {
			await prisma.service.delete({ where: { id } })

			if (serviceToDelete.departmentId) {
				await notifyManagerForServiceAction({
					entityId: serviceToDelete.departmentId,
					role: 'DEPARTMENT_MANAGER',
					from: serviceToDelete.from,
					to: serviceToDelete.to,
					action: 'delete',
				})
			}

			if (serviceToDelete.tribeId) {
				await notifyManagerForServiceAction({
					entityId: serviceToDelete.tribeId,
					role: 'TRIBE_MANAGER',
					from: serviceToDelete.from,
					to: serviceToDelete.to,
					action: 'delete',
				})
			}
		}

		return data({ success: true }, { status: 200 })
	}

	const submission = await parseWithZod(formData, {
		schema: schema.superRefine((fields, ctx) =>
			superRefineHandler(fields, ctx, id),
		),
		async: true,
	})

	if (submission.status !== 'success') {
		return json(
			{ success: false, lastResult: submission.reply() },
			{ status: 400 },
		)
	}

	const { value } = submission

	if (intent === FORM_INTENT.CREATE) {
		await createService(value)
	}

	if (intent === FORM_INTENT.UPDATE && id) {
		await updateService(id, value)
	}

	return json(
		{ success: true, lastResult: submission.reply() },
		{ status: 200 },
	)
}

export type ActionType = typeof actionFn

async function createService(data: z.infer<typeof schema>) {
	const { departmentId, tribeId, from, to } = data

	const service = prisma.service.create({
		data: {
			from: new Date(from),
			to: new Date(to),
			...(tribeId && {
				tribe: {
					connect: { id: tribeId },
				},
			}),
			...(departmentId && {
				department: {
					connect: { id: departmentId },
				},
			}),
		},
	})

	if (tribeId) {
		await notifyManagerForServiceAction({
			entityId: tribeId,
			role: 'TRIBE_MANAGER',
			from: new Date(from),
			to: new Date(to),
			action: 'create',
		})
	}

	if (departmentId) {
		await notifyManagerForServiceAction({
			entityId: departmentId,
			role: 'DEPARTMENT_MANAGER',
			from: new Date(from),
			to: new Date(to),
			action: 'create',
		})
	}

	return service
}

async function updateService(id: string, data: z.infer<typeof schema>) {
	const { from, to } = data

	const existingService = await prisma.service.findUnique({
		where: { id },
		select: {
			departmentId: true,
			tribeId: true,
		},
	})

	const service = await prisma.service.update({
		where: { id },
		data: {
			from: new Date(from),
			to: new Date(to),
		},
	})

	if (existingService?.departmentId) {
		await notifyManagerForServiceAction({
			entityId: existingService.departmentId,
			role: 'DEPARTMENT_MANAGER',
			from: new Date(from),
			to: new Date(to),
			action: 'update',
		})
	}

	if (existingService?.tribeId) {
		await notifyManagerForServiceAction({
			entityId: existingService.tribeId,
			role: 'TRIBE_MANAGER',
			from: new Date(from),
			to: new Date(to),
			action: 'update',
		})
	}

	return service
}
