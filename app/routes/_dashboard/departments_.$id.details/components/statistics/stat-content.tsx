import React from 'react'
import { Button } from '~/components/ui/button'
import { RiFileExcel2Line } from '@remixicon/react'
import { Views } from '../../models'
import { DepartmentStatistics } from './department-statistics'
import { StatHeader } from './stat-header'
import { InputSearch } from '~/components/form/input-search'
import { StatTable } from './stat-table'

interface StatContentProps {
	statView: keyof typeof Views
	setStatView: (view: keyof typeof Views) => void
	data: any
	onSearch: (query: string) => void
	onShowMore: () => void
}

export const StatContent: React.FC<StatContentProps> = React.memo(
	({ statView, setStatView, data, onSearch, onShowMore }) => (
		<div className="space-y-4">
			<DepartmentStatistics />
			<StatHeader
				title="Suivi des nouveaux fidèles"
				view={statView}
				setView={setStatView}
			>
				<div className="hidden sm:block">
					<InputSearch
						onSearch={onSearch}
						placeholder="Rechercher un utilisateur"
					/>
				</div>
				<div className="hidden sm:block">
					<Button variant="outline">
						<RiFileExcel2Line className="w-4 h-4" /> Exporter
					</Button>
				</div>
			</StatHeader>
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
