import { useFetcher } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { useOptionalUser } from './user.hook'

const NEW_NOTIFICATION_EVENT = 'new-notification'

interface NotificationData {
	title: string
	content: string
	userId: string
	notificationId: string
	link?: string
	refresher?: number
}

interface NotificationsResponse {
	notifications: Notification[]
	unread: number
	unseen: number
}

export function useNotifications() {
	const { load, data } = useFetcher<NotificationsResponse>()
	const user = useOptionalUser()
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [eventSource, setEventSource] = useState<EventSource | null>(null)
	const [eventData, setEventData] = useState<NotificationData | null>(null)

	useEffect(() => {
		let cleanup = () => {}

		async function setupEventSource() {
			try {
				await import('remix-utils/sse/react')

				if (user?.id) {
					const es = new EventSource(
						`/sse/notification?event=${NEW_NOTIFICATION_EVENT}:${user.id}`,
					)

					es.addEventListener(
						`${NEW_NOTIFICATION_EVENT}:${user.id}`,
						(event: MessageEvent) => {
							const parsedData = JSON.parse(event.data) as NotificationData
							setEventData(parsedData)
						},
					)

					setEventSource(es)

					cleanup = () => {
						es.close()
					}
				}
			} catch (error) {
				console.error(
					"Erreur lors de l'import du module useEventSource:",
					error,
				)
			}
		}

		setupEventSource()

		return () => {
			cleanup()
		}
	}, [user?.id])

	const { notifications = [], unread = 0, unseen = 0 } = data ?? {}

	useEffect(() => {
		load('/api/notifications')
	}, [load, eventData])

	return { notifications, unread, unseen }
}
