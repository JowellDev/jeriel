import { type ActionFunctionArgs, redirect } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import { getDomain } from '~/utils/url'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const url = getDomain(request)
	if (!currentUser) return redirect(`${url}notifications`)
	const { id } = params
	invariant(id, 'id is required read notification')
	const notification = await getNotification(id)
	if (!notification) return redirect(url)
	await prisma.notification.update({
		where: { id },
		data: { readAt: new Date() },
	})
	return redirect(`${url}${notification.url}`)
}

async function getNotification(id: string) {
	return prisma.notification.findFirst({
		where: { id },
	})
}
export type ActionType = typeof actionFn
