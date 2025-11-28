import { type LoaderFunctionArgs } from '@remix-run/node'
import { NEW_NOTIFICATION_EVENT } from '~/shared/constants'
import { emitter } from '~/utils/emitter'

type NotificationEvent = {
	title: string
	content: string
	userId: string
	notificationId: string
	link?: string
	refresher?: number
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { eventStream } = await import('remix-utils/sse/server')

	return eventStream(request.signal, function setup(send) {
		async function notificationEventHandler(data: NotificationEvent) {
			send({
				event: `${NEW_NOTIFICATION_EVENT}:${data.userId}`,
				data: JSON.stringify(data),
			})
		}

		emitter.on(NEW_NOTIFICATION_EVENT, notificationEventHandler)

		return () => {
			emitter.off(NEW_NOTIFICATION_EVENT, notificationEventHandler)
		}
	})
}
