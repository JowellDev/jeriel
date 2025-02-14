import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { ManagerHeader } from './manager-header'
import { Statistics } from '~/components/stats/statistics'
import { DEFAULT_VIEWS_OPTIONS, StatsToolbar } from '~/components/toolbar'
import MonthPicker from '~/components/form/month-picker'
import { Card } from '~/components/ui/card'
import type { LoaderType } from '../../loader.server'
import type { SerializeFrom } from '@remix-run/node'
import { useDashboard } from '../../hooks/use-dashboard'
import { SelectInput } from '~/components/form/select-input'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import { speedDialItems } from '../../constants'
import { Toolbar } from './toolbar'
import { renderTable } from '~/shared/member-table/table.utlis'

type LoaderReturnData = SerializeFrom<LoaderType>

interface DashboardProps {
	loaderData: LoaderReturnData
}

function ManagerDashboard({ loaderData }: Readonly<DashboardProps>) {
	const {
		data,
		view,
		statView,
		setStatView,
		handleSearch,
		currentMonth,
		handleOnPeriodChange,
		handleEntitySelection,
		handleDisplayMore,
		handleSpeedDialItemClick,
	} = useDashboard(loaderData)

	const views = [
		{
			id: 'CULTE' as const,
			label: 'Culte',
		},
		{
			id: 'MEETING' as const,
			label: 'Réunion',
		},
		{
			id: 'STAT' as const,
			label: 'Statistiques',
		},
	]

	const entityOptions =
		data?.entityStats.map(entity => ({
			value: entity?.id,
			label: `${
				entity?.type === 'tribe'
					? 'Tribu'
					: entity?.type === 'department'
						? 'Département'
						: "Famille d'honneur"
			} - ${entity?.entityName}`,
		})) || []

	return (
		<MainContent
			headerChildren={
				<ManagerHeader
					title="Bon retour !"
					userName={data?.user?.name}
					entityType={data?.entityStats?.[0]?.type}
					entityName={data?.entityStats?.[0]?.entityName}
					membersCount={data?.entityStats?.[0]?.memberCount}
				>
					<div className="hidden sm:flex sm:space-x-2 sm:items-center">
						{data?.entityStats.length > 1 && (
							<SelectInput
								placeholder="Sélectionner une entité"
								items={entityOptions}
								value={data?.entityStats?.[0]?.id}
								onChange={handleEntitySelection}
							/>
						)}
						<MonthPicker
							defaultMonth={currentMonth}
							onChange={handleOnPeriodChange}
						/>
					</div>
				</ManagerHeader>
			}
		>
			<div className="space-y-4">
				<div className="sm:hidden">
					<Toolbar
						onPeriodChange={handleOnPeriodChange}
						onEntityChange={handleEntitySelection}
						entityOptions={entityOptions}
						entityValue={data?.entityStats?.[0]?.id}
						showSelectInput={data?.entityStats.length > 1}
					/>
				</div>
				<Statistics />
				<StatsToolbar
					views={
						data?.entityStats?.[0]?.type === 'honorFamily'
							? views
							: DEFAULT_VIEWS_OPTIONS
					}
					title="Suivi des nouveaux fidèles"
					view={statView}
					setView={setStatView}
					onSearch={handleSearch}
				/>

				<Card>
					{renderTable({
						view,
						statView,
						data: data?.members ?? [],
					})}
					<div className="mt-2 mb-2 flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
							disabled={data.members.length === data.total}
							onClick={handleDisplayMore}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>

			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}

export default ManagerDashboard
