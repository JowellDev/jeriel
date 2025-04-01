import { MainContent } from '~/components/layout/main-content'
import { type MetaFunction } from '@remix-run/node'
import { loaderFn } from './loader.server'
import { actionFn } from './action.server'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { NotificationDetails } from './components/notifications-details'
import type { NotificationFilter } from './types'
import { useState } from 'react'
import { InputSearch } from '~/components/form/input-search'
import { useLoaderData } from '@remix-run/react'
import { Button } from '~/components/ui/button'

export const meta: MetaFunction = () => [{ title: 'Notifications' }]

export const loader = loaderFn
export const action = actionFn

export default function Notifications() {
	const { notifications } = useLoaderData<typeof loaderFn>()
	const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all')
	const filterNotifications = (filterType: NotificationFilter) => {
		setActiveFilter(filterType)
	}
	return (
		<MainContent>
			<div className="flex h-screen justify-center items-center">
				<Card className="w-full md:w-[1080px] md:mx-auto border-none rounded text-[#424242] flex flex-col">
					<CardHeader className="border-b border-gray-200 sticky top-0 bg-white sm:z-10">
						<div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
							<div className="flex gap-2 w-full sm:w-auto">
								<button
									key={'all'}
									onClick={() => filterNotifications('all')}
									className={`px-4 py-2 rounded-full transition-colors text-sm ${
										activeFilter === 'all'
											? 'bg-[#157a73] text-white'
											: 'text-[#8E8E93]'
									}`}
								>
									Tout
								</button>
								<button
									key={'unread'}
									onClick={() => filterNotifications('unread')}
									className={`px-4 py-2 rounded-full transition-colors text-sm ${
										activeFilter === 'unread'
											? 'bg-[#157a73] text-white'
											: 'text-[#8E8E93]'
									}`}
								>
									Non lu
								</button>
							</div>
							<div className="w-full sm:w-fit sm:flex sm:items-center">
								<InputSearch
									className="w-full sm:w-96"
									onSearch={() => {}}
									placeholder="Rechercher"
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent className="mt-4 mb-4 max-h-[30rem] sm:max-h-[45rem] overflow-y-auto flex-1">
						<NotificationDetails notifications={notifications} />
						{notifications.length > 0 && (
							<div className="flex mt-3 justify-center">
								<Button
									size="sm"
									type="button"
									variant="ghost"
									disabled={true}
									className="bg-neutral-200 rounded-full"
								>
									Voir plus
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</MainContent>
	)
}
