import { type ActionFunctionArgs } from '@remix-run/node'
import { schema } from '../schema'
import { parseWithZod } from '@conform-to/zod'
import { requireUser } from '~/utils/auth.server'
import { z, type RefinementCtx } from 'zod'
import { FORM_INTENT } from '../constants'
import { prisma } from '~/infrastructures/database/prisma.server'
import { notifyManagerForServiceAction } from '~/helpers/notification.server'
import invariant from 'tiny-invariant'

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
			message: 'Période de service déjà existante',
			path: ['from'],
		})
	}
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)

	const { id: serviceId } = params
	const formData = await request.formData()
	const intent = formData.get('intent')

	const churchId = currentUser.churchId

	invariant(churchId, 'Current user must be associated with a church')

	if (intent === FORM_INTENT.DELETE && serviceId) {
		await deleteService(serviceId)

		return { status: 'success' }
	}

	const submission = await parseWithZod(formData, {
		schema: schema.superRefine((fields, ctx) =>
			superRefineHandler(fields, ctx, serviceId),
		),
		async: true,
	})

	if (submission.status !== 'success') return submission.reply()

	const { value } = submission

	if (intent === FORM_INTENT.CREATE) {
		await createService(value, churchId)
	}

	if (intent === FORM_INTENT.UPDATE && serviceId) {
		await updateService(serviceId, value)
	}

	return { status: 'success' }
}

export type ActionType = typeof actionFn

async function createService(data: z.infer<typeof schema>, churchId: string) {
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
			church: {
				connect: { id: churchId },
			},
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

	const service = await prisma.service.update({
		where: { id },
		data: {
			from: new Date(from),
			to: new Date(to),
		},
	})

	if (service?.departmentId) {
		await notifyManagerForServiceAction({
			entityId: service.departmentId,
			role: 'DEPARTMENT_MANAGER',
			from: new Date(from),
			to: new Date(to),
			action: 'update',
		})
	}

	if (service?.tribeId) {
		await notifyManagerForServiceAction({
			entityId: service.tribeId,
			role: 'TRIBE_MANAGER',
			from: new Date(from),
			to: new Date(to),
			action: 'update',
		})
	}

	return service
}

async function deleteService(id: string) {
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

	return { status: 'success' }
}
