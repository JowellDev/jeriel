import { MainContent } from '~/components/layout/main-content'
import { type MetaFunction } from '@remix-run/node'
import { loaderFn } from './loader.server'
import { actionFn } from './action.server'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { NotificationDetails } from './components/notifications-details'
import { InputSearch } from '~/components/form/input-search'
import { useNotifications } from './hooks/use-notifications'
import { Button } from '~/components/ui/button'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export const loader = loaderFn
export const action = actionFn

export const meta: MetaFunction = () => [{ title: 'Jeriel | Notifications' }]

export default function Notifications() {
	const {
		data,
		activeFilter,
		filterNotifications,
		handleDisplayMore,
		handleSearch,
	} = useNotifications()

	return (
		<MainContent>
			<div className="flex min-h-full justify-center items-start py-8">
				<Card className="w-full md:w-[1080px] md:mx-auto rounded-xl shadow-sm text-foreground flex flex-col">
					<CardHeader className="border-b border-border sticky top-0 bg-card rounded-t-xl sm:z-10">
						<h1 className="mb-2 text-lg font-bold text-primary">
							Notifications
						</h1>
						<div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
							<div className="flex gap-2 w-full sm:w-auto">
								<button
									key={'all'}
									onClick={() => filterNotifications('all')}
									className={`px-4 py-2 rounded-full transition-colors text-sm ${
										activeFilter === 'all'
											? 'bg-primary text-primary-foreground'
											: 'text-muted-foreground hover:bg-muted'
									}`}
								>
									Tout
								</button>
								<button
									key={'unread'}
									onClick={() => filterNotifications('unread')}
									className={`px-4 py-2 rounded-full transition-colors text-sm ${
										activeFilter === 'unread'
											? 'bg-primary text-primary-foreground'
											: 'text-muted-foreground hover:bg-muted'
									}`}
								>
									Non lu
								</button>
							</div>
							<div className="w-full sm:w-fit sm:flex sm:items-center">
								<InputSearch
									className="w-full sm:w-96"
									onSearch={handleSearch}
									placeholder="Rechercher"
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent className="mt-4 mb-4 max-h-[36rem] sm:max-h-[45rem] overflow-y-auto flex-1">
						<NotificationDetails notifications={data.notifications} />
						{data.notifications.length > 0 && (
							<div className="flex mt-3 justify-center">
								<Button
									size="sm"
									type="button"
									variant="ghost"
									disabled={data.notifications.length >= data.filterData.total}
									onClick={handleDisplayMore}
									className="bg-muted rounded-full"
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

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
