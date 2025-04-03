import { type ActionFunctionArgs, redirect } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { getDomain } from '~/utils/url'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)

	const url = getDomain(request)

	if (!currentUser) return redirect(`${url}notifications`)

	const { id } = params

	invariant(id, 'id is required read notification')

	const notification = await getNotification(id)

	if (!notification) {
		return redirect(url)
	} else {
		await prisma.notification.update({
			where: {
				id: id,
			},
			data: {
				readAt: new Date(),
			},
		})
		const redirectUrl = `${url}${notification.url}`
		return redirect(redirectUrl)
	}
}

async function getNotification(id: string) {
	return prisma.notification.findFirst({
		where: { id },
	})
}
export type ActionType = typeof actionFn
