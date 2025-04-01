import type { NotificationFormated } from '../types'
import { RiNotification2Line } from '@remixicon/react'
import { useFetcher } from '@remix-run/react'
import { formatDateWithRelativeTime } from '~/utils/date'

interface NotificationDetailsProps {
	notifications: NotificationFormated[]
}

interface NotificationDetailsItemProps {
	notification: NotificationFormated
}

export function NotificationDetails({
	notifications,
}: Readonly<NotificationDetailsProps>) {
	return (
		<div className="grid grid-cols-1 gap-4">
			{notifications.length > 0 ? (
				notifications.map(notification => (
					<NotificationDetailsItem
						key={notification.id}
						notification={notification}
					/>
				))
			) : (
				<div className="px-4 py-6 font-bold text-center text-xl text-gray-500">
					Aucune notification
				</div>
			)}
		</div>
	)
}

export function NotificationDetailsItem({
	notification,
}: Readonly<NotificationDetailsItemProps>) {
	const fetcher = useFetcher()

	const goToNotifications = (id: string) => {
		fetcher.submit(
			{},
			{
				action: `/notifications/${id}/read`,
				method: 'POST',
			},
		)
	}

	return (
		<div
			key={notification.id}
			className={`flex items-start gap-4 p-4 transition-colors cursor-pointer ${
				notification.readAt === null
					? 'bg-[#F5F5F5]'
					: 'border-[0.5px] border-[#B5B5B547]'
			} rounded-[5px]`}
			onClick={() => goToNotifications(notification.id)}
			onKeyDown={() => goToNotifications(notification.id)}
		>
			<div className="flex-grow min-w-0">
				<div className="flex items-start justify-between gap-2 m-1">
					<div className="w-full space-y-3">
						<div className="flex items-center space-x-2 my-2">
							<RiNotification2Line
								size={24}
								className={`text-[${
									notification.readAt === null ? '#157a73' : '#687076'
								}]`}
							/>

							<span
								className={`font-sans font-bold text-base ${notification.readAt === null ? 'text-[#157a73]' : 'text-[#687076]'}`}
							>
								{notification.title}
							</span>
						</div>

						<p className="font-sans text-sm text-gray-600">
							{notification.content}
						</p>
						<p className="font-sans font-bold text-xs text-gray-500 text-right">
							{formatDateWithRelativeTime(new Date(notification.createdAt))}
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
