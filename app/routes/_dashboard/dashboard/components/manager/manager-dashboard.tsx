import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { ManagerHeader } from './manager-header'
import MonthPicker from '~/components/form/month-picker'
import { Card } from '~/components/ui/card'
import type { LoaderType } from '../../loader.server'
import type { SerializeFrom } from '@remix-run/node'
import { useDashboard } from '../../hooks/use-dashboard'
import { SelectInput } from '~/components/form/select-input'
import { newViews, views } from '../../constants'
import { Toolbar } from './toolbar'
import { renderTable } from '~/shared/member-table/table.utlis'
import { ManagerStatistics } from '~/components/stats/manager/manager-statistics'
import { DEFAULT_VIEWS_OPTIONS, StatsToolbar } from '~/components/toolbar'
import { ViewsToolbar } from './views-toolbar'

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
		newView,
		setNewView,
		handleSearch,
		currentMonth,
		handleOnPeriodChange,
		handleEntitySelection,
		handleDisplayMore,
		statsData,
		isFecthing,
		entityOptions,
		selectedEntity,
	} = useDashboard(loaderData)

	const isHonorFamilyManager = data.user.roles.some(
		role => role === 'HONOR_FAMILY_MANAGER',
	)

	const canSeeMeetingStats =
		data?.entityStats.length > 1
			? isHonorFamilyManager && selectedEntity === 'honorFamily'
			: isHonorFamilyManager

	return (
		<MainContent
			headerChildren={
				<ManagerHeader
					title="Bon retour !"
					userName={data?.user?.name}
					entityType={data?.entityStats?.[0]?.type}
					entityName={data?.entityStats?.[0]?.entityName}
					membersCount={data?.entityStats?.[0]?.memberCount}
					views={newViews}
					view={newView}
					setView={setNewView}
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
			<div className="space-y-2">
				<div className="sm:hidden">
					<ViewsToolbar views={newViews} view={newView} setView={setNewView} />
				</div>
				<div className="sm:hidden">
					<Toolbar
						onPeriodChange={handleOnPeriodChange}
						onEntityChange={handleEntitySelection}
						entityOptions={entityOptions}
						entityValue={data?.entityStats?.[0]?.id}
						showSelectInput={data?.entityStats.length > 1}
					/>
				</div>

				{newView === 'NEW_MEMBERS' ? (
					<div className="space-y-2 pb-4 mb-2">
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
				) : (
					<div className="grid sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
						<div className="sm:col-span-1 md:col-span-1">
							<ManagerStatistics
								newMemberStats={{
									title: 'Présence aux cultes',
									statistics: [
										{
											name: 'Présence moyenne des nouveaux',
											value: statsData?.culte?.averageNewMembersAttendance ?? 0,
											color: '#34C759',
										},
										{
											name: 'Présence moyenne des anciens',
											value: statsData?.culte?.averageOldMembersAttendance ?? 0,
											color: '#FFCC00',
										},
									],
									total: statsData?.culte?.averageGeneralAttendance ?? 0,
								}}
								oldMemberStats={{
									title: 'Absence aux cultes',
									statistics: [
										{
											name: 'Absence moyenne des nouveaux',
											value: statsData?.culte?.averageNewMembersAbsence ?? 0,
											color: '#B71C1C',
										},
										{
											name: 'Absence moyenne des anciens',
											value: statsData?.culte?.averageOldMembersAbsence ?? 0,
											color: '#FF4D6A',
										},
									],
									total: statsData?.culte?.averageGeneralAbsence ?? 0,
								}}
								isFecthing={isFecthing}
							/>
						</div>
						{canSeeMeetingStats ? (
							<div className="sm:col-span-1 md:col-span-1">
								<ManagerStatistics
									newMemberStats={{
										title: 'Présence aux réunions',
										statistics: [
											{
												name: 'Présence moyenne des nouveaux',
												value:
													statsData?.reunion?.averageNewMembersAttendance ?? 0,
												color: '#34C759',
											},
											{
												name: 'Présence moyenne des anciens',
												value:
													statsData?.reunion?.averageOldMembersAttendance ?? 0,
												color: '#FFCC00',
											},
										],
										total: statsData?.reunion?.averageGeneralAttendance ?? 0,
									}}
									oldMemberStats={{
										title: 'Absence aux réunions',
										statistics: [
											{
												name: 'Absence moyenne des nouveaux',
												value:
													statsData?.reunion?.averageNewMembersAbsence ?? 0,
												color: '#B71C1C',
											},
											{
												name: 'Absence moyenne des anciens',
												value:
													statsData?.reunion?.averageOldMembersAbsence ?? 0,
												color: '#FF4D6A',
											},
										],
										total: statsData?.reunion?.averageGeneralAbsence ?? 0,
									}}
									isFecthing={isFecthing}
								/>
							</div>
						) : (
							<div className="sm:col-span-1 md:col-span-1">
								<ManagerStatistics
									newMemberStats={{
										title: 'Présence aux services',
										statistics: [
											{
												name: 'Présence moyenne des nouveaux',
												value:
													statsData?.service?.averageNewMembersAttendance ?? 0,
												color: '#34C759',
											},
											{
												name: 'Présence moyenne des anciens',
												value:
													statsData?.service?.averageOldMembersAttendance ?? 0,
												color: '#FFCC00',
											},
										],
										total: statsData?.service?.averageGeneralAttendance ?? 0,
									}}
									oldMemberStats={{
										title: 'Absence aux services',
										statistics: [
											{
												name: 'Absence moyenne des nouveaux',
												value:
													statsData?.service?.averageNewMembersAbsence ?? 0,
												color: '#B71C1C',
											},
											{
												name: 'Absence moyenne des anciens',
												value:
													statsData?.service?.averageOldMembersAbsence ?? 0,
												color: '#FF4D6A',
											},
										],
										total: statsData?.service?.averageGeneralAbsence ?? 0,
									}}
									isFecthing={isFecthing}
								/>
							</div>
						)}
					</div>
				)}
			</div>
		</MainContent>
	)
}

export default ManagerDashboard
