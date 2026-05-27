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

	invariant(
		currentUser.churchId,
		'Current user must be associated with a church',
	)

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

	if (intent === FORM_INTENT.CREATE)
		await createService(submission.value, currentUser.churchId)
	if (intent === FORM_INTENT.UPDATE && serviceId)
		await updateService(serviceId, submission.value)

	return { status: 'success' }
}

export type ActionType = typeof actionFn

async function notifyEntityManagers(
	entity: { tribeId?: string | null; departmentId?: string | null },
	from: Date,
	to: Date,
	action: 'create' | 'update' | 'delete',
) {
	const notifications = []
	if (entity.tribeId) {
		notifications.push(
			notifyManagerForServiceAction({
				entityId: entity.tribeId,
				role: 'TRIBE_MANAGER',
				from,
				to,
				action,
			}),
		)
	}
	if (entity.departmentId) {
		notifications.push(
			notifyManagerForServiceAction({
				entityId: entity.departmentId,
				role: 'DEPARTMENT_MANAGER',
				from,
				to,
				action,
			}),
		)
	}
	await Promise.all(notifications)
}

async function createService(data: z.infer<typeof schema>, churchId: string) {
	const { departmentId, tribeId, from, to } = data
	const fromDate = new Date(from)
	const toDate = new Date(to)

	const service = await prisma.service.create({
		data: {
			from: fromDate,
			to: toDate,
			...(tribeId && { tribe: { connect: { id: tribeId } } }),
			...(departmentId && { department: { connect: { id: departmentId } } }),
			church: { connect: { id: churchId } },
		},
	})

	await notifyEntityManagers(
		{ tribeId, departmentId },
		fromDate,
		toDate,
		'create',
	)
	return service
}

async function updateService(id: string, data: z.infer<typeof schema>) {
	const { from, to } = data
	const fromDate = new Date(from)
	const toDate = new Date(to)

	const service = await prisma.service.update({
		where: { id },
		data: { from: fromDate, to: toDate },
	})

	await notifyEntityManagers(service, fromDate, toDate, 'update')
	return service
}

async function deleteService(id: string) {
	const service = await prisma.service.findUnique({
		where: { id },
		select: { from: true, to: true, departmentId: true, tribeId: true },
	})

	if (service) {
		await prisma.service.delete({ where: { id } })
		await notifyEntityManagers(service, service.from, service.to, 'delete')
	}

	return { status: 'success' }
}
