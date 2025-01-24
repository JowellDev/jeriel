import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { ManagerHeader } from './manager-header'
import { Statistics } from '~/components/stats/statistics'
import { StatsToolbar } from '~/components/toolbar'
import { type ViewOption } from '~/components/toolbar'
import { useState } from 'react'
import { renderTable } from './table/render-table.utils'
import DateSelector from '~/components/form/date-selector'
import { Card } from '~/components/ui/card'

interface ManagerDashboardProps {
	data: {
		user: {
			name: string
		}
	}
}

function ManagerDashboard({ data }: Readonly<ManagerDashboardProps>) {
	const [view, setView] = useState<ViewOption>('CULTE')

	function onSearch() {
		//
	}

	return (
		<MainContent
			headerChildren={
				<ManagerHeader title="Bon retour !" userName={data.user.name}>
					<div className="hidden sm:flex sm:space-x-2 sm:items-center">
						<DateSelector onChange={() => {}} />
						<Button className="hidden sm:block" variant={'primary'}>
							Marquer la présence
						</Button>
					</div>
				</ManagerHeader>
			}
		>
			<div className="space-y-4">
				<Statistics />
				<StatsToolbar
					title="Suivi des nouveaux fidèles"
					view={view}
					setView={setView}
					onSearch={onSearch}
				/>

				<Card>
					{renderTable({
						view,
						data: [],
					})}
					<div className="mt-2 mb-2 flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
							disabled={true}
							onClick={() => {}}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>
		</MainContent>
	)
}

export default ManagerDashboard
