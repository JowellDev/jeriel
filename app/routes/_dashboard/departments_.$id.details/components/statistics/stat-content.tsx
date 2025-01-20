import React from 'react'
import { Button } from '~/components/ui/button'
import { StatTable } from './stat-table'
import { StatsToolbar, Views, type ViewOption } from '~/components/toolbar'
import { Statistics } from '~/components/stats/statistics'

interface StatContentProps {
	statView: ViewOption
	setStatView: (view: ViewOption) => void
	data: any
	onSearch: (query: string) => void
	onExport: () => void
	onShowMore: () => void
}

export const StatContent: React.FC<StatContentProps> = React.memo(
	({ statView, setStatView, data, onSearch, onExport, onShowMore }) => (
		<div className="space-y-4">
			<Statistics />
			<StatsToolbar
				title="Suivi des nouveaux fidèles"
				view={statView}
				setView={setStatView}
				onSearch={onSearch}
				onExport={onExport}
			/>

			{(statView === Views.CULTE || statView === Views.SERVICE) && (
				<StatTable data={data.members} departmentId={data.department.id} />
			)}
			<div className="flex justify-center">
				<Button
					size="sm"
					type="button"
					variant="ghost"
					className="bg-neutral-200 rounded-full"
					disabled={data.members.length === data.total}
					onClick={onShowMore}
				>
					Voir plus
				</Button>
			</div>
		</div>
	),
)

StatContent.displayName = 'StatContent'
