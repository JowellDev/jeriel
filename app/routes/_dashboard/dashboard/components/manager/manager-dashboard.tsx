import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { ManagerHeader } from './manager-header'
import { Statistics } from '~/components/stats/statistics'
import { StatsToolbar } from '~/components/toolbar'
import { renderTable } from './table/render-table.utils'
import DateSelector from '~/components/form/date-selector'
import { Card } from '~/components/ui/card'
import type { LoaderType } from '../../loader.server'
import type { SerializeFrom } from '@remix-run/node'
import { useDashboard } from '../../hooks/use-dashboard'
import { SelectInput } from '~/components/form/select-input'

type LoaderReturnData = SerializeFrom<LoaderType>

interface DashboardProps {
	loaderData: LoaderReturnData
}

function ManagerDashboard({ loaderData }: Readonly<DashboardProps>) {
	const {
		data,
		view,
		setView,
		handleSearch,
		currentMonth,
		handleOnPeriodChange,
		handleEntitySelection,
	} = useDashboard(loaderData)

	const entityOptions =
		data?.entityStats.map(entity => ({
			value: entity.id,
			label: `${
				entity.type === 'tribe'
					? 'Tribu'
					: entity.type === 'department'
						? 'Département'
						: "Famille d'honneur"
			} - ${entity.entityName}`,
		})) || []

	return (
		<MainContent
			headerChildren={
				<ManagerHeader
					title="Bon retour !"
					userName={data?.user?.name}
					entityType={data?.entityStats[0].type}
					entityName={data?.entityStats[0].entityName}
					membersCount={data.entityStats[0].memberCount}
				>
					<div className="hidden sm:flex sm:space-x-2 sm:items-center">
						{data?.entityStats.length > 1 && (
							<SelectInput
								placeholder="Sélectionner une entité"
								items={entityOptions}
								value={data?.entityStats[0].id}
								onChange={handleEntitySelection}
							/>
						)}
						<DateSelector
							defaultMonth={currentMonth}
							onChange={handleOnPeriodChange}
						/>

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
					onSearch={handleSearch}
				/>

				<Card>
					{renderTable({
						view,
						data: data?.members,
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
